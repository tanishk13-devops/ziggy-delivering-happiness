# ==========================================
# Stage 1: Build Angular Frontend
# ==========================================
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
# Shared origin means base api route is simply "/api"
ENV NG_APP_API_URL=/api
RUN npm run build:prod

# ==========================================
# Stage 2: Build C# .NET Backend
# ==========================================
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS backend-build
WORKDIR /src

COPY backend/FoodDeliveryAPI.csproj ./backend/
RUN dotnet restore backend/FoodDeliveryAPI.csproj

COPY backend/ ./backend/
WORKDIR /src/backend
RUN dotnet build FoodDeliveryAPI.csproj -c Release -o /app/build

# ==========================================
# Stage 3: Publish C# Backend
# ==========================================
FROM backend-build AS publish
RUN dotnet publish FoodDeliveryAPI.csproj -c Release -o /app/publish

# ==========================================
# Stage 4: Run Application
# ==========================================
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app

COPY --from=publish /app/publish .
# Copy Angular bundles to the C# static resources folder
COPY --from=frontend-build /app/frontend/dist/food-delivery-app ./wwwroot

ENV PORT=80
EXPOSE 80
ENTRYPOINT ["dotnet", "FoodDeliveryAPI.dll"]
