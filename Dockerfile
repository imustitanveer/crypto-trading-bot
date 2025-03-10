
FROM python:3.9


WORKDIR /code


COPY ./requirements.txt /code/requirements.txt


COPY ./scripts/models /code/models


RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt


COPY ./app /code/app


CMD ["uvicorn", "app.main:app", "--port", "80"]