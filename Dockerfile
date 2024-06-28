FROM node:20.15.0-alpine AS builder

WORKDIR /app
COPY frontend frontend
RUN cd frontend && npm install && npm run build


FROM node:20.15.0-alpine
WORKDIR /app
RUN mkdir /app/data
COPY --from=builder /app/frontend/dist /app/frontend/dist
COPY backend air780eg
RUN cd air780eg && npm install && npx prisma db push && npx prisma generate
RUN mv /app/data/database.dat /app/database.dat
EXPOSE 3000
VOLUME /app/data
COPY init.sh /init.sh
CMD ["sh","/init.sh"]
