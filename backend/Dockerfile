# Obraz bazowy Python
FROM python:3.10-slim

# Ustawienie zmiennych srodowiskowych
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Ustawienie katalogu roboczego
WORKDIR /app

# Instalacja zaleznosci systemowych
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Kopiowanie i instalacja zaleznosci Pythona
COPY requirements.txt /app/
RUN pip install --upgrade pip && pip install -r requirements.txt

# Kopiowanie reszty kodu backendu
COPY . /app/

# Port na ktorym dziala Django
EXPOSE 8000

# Komenda startowa
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
