
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.prompts import ChatPromptTemplate
import ollama
from transformers import AutoTokenizer

PATH_TO_CHROMA_COLLECTIONS="app/chroma"
EMBEDDING_MODEL_NAME="all-MiniLM-L6-v2"
ENCODING_MODEL_NAME="sentence-transformers/all-MiniLM-L6-v2"
LLM_MODEL_NAME="llama3:8b-instruct-q4_0"


PROMPT_TEMPLATE = """
Answer the question based only on the following context:

{context}

---

Answer the question based on the above context: {question}
Do not start with "According to the provided context" and only provide relevant answer. 
Prefer using paragraphs instead of pointers unless you are listing something or the question specificly requests it.
"""

embedding_function = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_NAME)


tokenizer = AutoTokenizer.from_pretrained(ENCODING_MODEL_NAME)
def count_tokens(text: str) -> int:
    return len(tokenizer.tokenize(text))


def generate_llm_response(
        chroma_collection_name: str,
        user_query: str
):
    import os
    chroma_path = os.path.join("./backend", PATH_TO_CHROMA_COLLECTIONS, chroma_collection_name)

    # Load the vectorstore collection
    db_chroma = Chroma(
        persist_directory=chroma_path,
        collection_name=chroma_collection_name,
        embedding_function=embedding_function
    )

    print("\nChroma contains", db_chroma._collection.count(), "documents")

    query_text = user_query
    results = db_chroma.similarity_search_with_relevance_scores(query_text, k=3)
    print('\nSimilarity search results count:\n', len(results))

    if len(results) == 0 or results[0][1] > 0.7:
        assistant_content = "I'm sorry, I couldn't find relevant context to answer your question."
        context_text = ""
    else:
        context_text = "\n\n---\n\n".join([doc.page_content for doc, _ in results])

        # Build prompt
        prompt = ChatPromptTemplate.from_template(PROMPT_TEMPLATE).format(
            context=context_text, question=query_text
        )

        llm_input = [{"role": "user", "content": prompt}]
        # print('\nConstructed prompt:\n', llm_input)

        # # Construct final chat prompt
        # chat_prompt = construct_llm_prompt(
        #     db=db,
        #     conversation_id=conversation_id,
        #     user_query=prompt,
        # )

        # Generate response using ollama
        response = ollama.chat(
            model=LLM_MODEL_NAME,
            messages=llm_input,
        )

        assistant_content = response['message']['content']

    # Token usage tracking
    total_input_text = "\n".join([m["content"] for m in llm_input]) if results else query_text
    input_tokens = count_tokens(total_input_text)
    output_tokens = count_tokens(assistant_content)

    print('\nInput tokens: ', input_tokens)
    print('\nOutput tokens: ', output_tokens)
    print('\nLLM Response:\n', assistant_content)


# inputs
chroma_collection_name = 'Apple'
user_query = 'What are the features of the latest Mac mini with M4 chip?'

generate_llm_response(chroma_collection_name=chroma_collection_name, user_query=user_query)


# from langchain_community.vectorstores import Chroma
# from langchain.docstore.document import Document

# docs = [Document(page_content="Apple Inc. is a tech company.")]
# db = Chroma.from_documents(
#     documents=docs,
#     embedding=embedding_function,
#     collection_name="Apple",
#     persist_directory="backend/app/chroma"
# )
# db.persist()
# print("Added test doc.")
