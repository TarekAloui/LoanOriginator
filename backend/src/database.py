import json
from google.cloud import firestore


def save_statement_analysis(statement_id, statement_analysis):
    db = firestore.Client()
    doc_ref = db.collection("statements").document(statement_id)

    # serializing statement_analysis
    statement_analysis = json.dumps(statement_analysis)
    statement_analysis = json.loads(statement_analysis)

    doc_ref.set(statement_analysis)


def save_training_statement_analysis(statement_id):
    db = firestore.Client()
    doc_ref = db.collection("training").document(statement_id)

    doc_value = {"statement_ref": statement_id}

    doc_ref.set(doc_value)


def get_training_statements(log=False):
    db = firestore.Client()
    training_collection_ref = db.collection("training")
    training_docs = training_collection_ref.get()

    training_statements = []

    for training_doc in training_docs:
        if training_doc.exists:
            statement_ref = training_doc.to_dict().get("statement_ref")

            if statement_ref:
                statement_analysis_doc = (
                    db.collection("statements").document(statement_ref).get()
                )

                if statement_analysis_doc.exists:
                    statement_analysis_data = statement_analysis_doc.to_dict()

                    training_statements.append(statement_analysis_data)

    if log:
        print(f"Training Statements: {training_statements}")

    return training_statements
