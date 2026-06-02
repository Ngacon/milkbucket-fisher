# Chuyển sang stage chạy runtime (Ví dụ nếu mày xài node:slim hoặc alpine)
FROM node:20-slim AS runtime
WORKDIR /app

# CHÈN NGAY ĐOẠN NÀY VÀO: Cài đặt OpenSSL trực tiếp vào trong lòng Docker Container
RUN apt-get update -y && apt-get install -y openssl

# Đống lệnh COPY hiện tại của mày (khớp y chang với log #15 đến #19)
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/src/dashboard/views ./src/dashboard/views
COPY --from=build /app/src/database/seed-data ./src/database/seed-data
COPY --from=build /app/package.json ./package.json

# Cài lại production dependencies để đảm bảo prisma client nhận cấu hình mới
RUN npm install --omit=dev

# Lệnh khởi chạy của mày
CMD ["node", "dist/src/index.js"]