FROM python:latest

WORKDIR /app

COPY src app/
COPY secrets/ app/secrets
COPY requirements.txt /app/requirements.txt

RUN pip install -r requirements.txt

