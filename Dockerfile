FROM python:3.13-alpine AS course-builder

WORKDIR /workspace

COPY requirements-build.txt ./
RUN pip install --no-cache-dir -r requirements-build.txt

COPY scripts/ ./scripts/
COPY content/ ./content/
COPY deliverables.registry.json ./deliverables.registry.json
COPY materiales/analisis-datos/ ./materiales/analisis-datos/
COPY materiales/validacion/ ./materiales/validacion/
COPY materiales/ia/fuentes-comunes/ ./materiales/ia/fuentes-comunes/
COPY docs/ ./docs/
COPY css/ ./css/
COPY js/ ./js/

RUN python scripts/build-challenge-materials.py \
    && python scripts/build-ai-task-kits.py \
    && python scripts/build-course.py \
    && python scripts/build-styled-documents.py --format-downloads \
    && python scripts/build-analysis-materials.py

FROM nginx:1.27-alpine

RUN apk add --no-cache curl \
    && rm -rf /usr/share/nginx/html/*

COPY --from=course-builder /workspace/index.html /usr/share/nginx/html/index.html
COPY --from=course-builder /workspace/docs/ /usr/share/nginx/html/docs/
COPY --from=course-builder /workspace/materiales/retos/ /usr/share/nginx/html/materiales/retos/
COPY --from=course-builder /workspace/materiales/ia/ /usr/share/nginx/html/materiales/ia/
COPY --from=course-builder /workspace/materiales/analisis-datos/ /usr/share/nginx/html/materiales/analisis-datos/
COPY materiales/validacion/ /usr/share/nginx/html/materiales/validacion/
COPY guide.manifest.json /usr/share/nginx/html/
COPY deliverables.registry.json /usr/share/nginx/html/
COPY --from=course-builder /workspace/css/ /usr/share/nginx/html/css/
COPY --from=course-builder /workspace/js/ /usr/share/nginx/html/js/
COPY media/ /usr/share/nginx/html/media/

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -fsS http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
