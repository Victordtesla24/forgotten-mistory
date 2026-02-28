FROM ghcr.io/ggerganov/llama.cpp:server
ENV MODEL_PATH=/models/mistral-7b-instruct.Q5_K_M.gguf
EXPOSE 11434
CMD ["--host", "0.0.0.0", "--port", "11434", "-m", "/models/mistral-7b-instruct.Q5_K_M.gguf", "-ngl", "0", "-c", "4096"]
