FROM python:latest



WORKDIR /app

COPY src /app/
RUN apt-get update

#COPY secrets/ /app/secrets

COPY requirements.txt /app/requirements.txt
RUN pip install --upgrade pip

RUN pip install -r requirements.txt

CMD uvicorn main:app --reload --port=8000 --host=0.0.0.0

