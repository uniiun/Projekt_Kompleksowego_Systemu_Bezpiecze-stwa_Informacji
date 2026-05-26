# Obraz bazowy Node.js
FROM node:18-alpine

# Ustawienie katalogu roboczego
WORKDIR /app

# Kopiowanie plikow package.json i package-lock.json
COPY package*.json /app/

# Instalacja zaleznosci
RUN npm install

# Kopiowanie reszty kodu frontendu
COPY . /app/

# Port na ktorym dziala Vite
EXPOSE 5173

# Komenda startowa (host umozliwia dostep spoza kontenera)
CMD ["npm", "run", "dev", "--", "--host"]
