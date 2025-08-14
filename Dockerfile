# ---- Base Stage (Común para todas las fases) ----
FROM node:18-bullseye AS base

WORKDIR /app

# Instalar dependencias del sistema necesarias para Node y Python
RUN apt-get update --allow-insecure-repositories \
    && apt-get install -y python3 wget python3-pip make g++ bash curl \
    && rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*

# Instalar dependencias de Python (Torch, Transformers, Pillow)

## RUN pip3 install --upgrade pip
## RUN pip3 install torch transformers Pillow

# Instalar dependencias de Node
COPY package.json package-lock.json ./
RUN npm install

# Copiar archivos comunes (si es necesario para ambas fases)
COPY ./public ./public
COPY ./scripts ./scripts

# ---- Development Stage ----
FROM base AS dev

# Copiar el código fuente para desarrollo
COPY . .

# Configuración de entorno para desarrollo
ENV NODE_ENV=development

# Exponer el puerto para desarrollo
EXPOSE 3000

# Comando para ejecutar el servidor en modo desarrollo
CMD ["npm", "run", "dev"]

# ---- Build Stage (Construcción de la aplicación) ----
FROM base AS build

# Copiar el resto del código fuente para compilación
COPY . .

# Configuración de entorno para construcción
ENV NODE_ENV=production

# Construir la aplicación de Next.js
RUN npm run build

# ---- Production Stage ----
FROM node:18-bullseye AS prod

WORKDIR /app

# Copiar los archivos necesarios desde la etapa de construcción
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/scripts ./scripts

# Instalar dependencias necesarias para producción (si aplica)

## RUN apt-get update && apt-get install -y python3 python3-pip
## RUN pip3 install torch transformers Pillow

# Configuración de entorno para producción
ENV NODE_ENV=production

# Exponer el puerto para producción
EXPOSE 3000

# Comando para ejecutar el servidor en modo producción
CMD ["npm", "start"]
    