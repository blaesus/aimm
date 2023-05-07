# AIMM

AI Model Manager.

## Terminology

| APM        | Civitai            | HuggingFace      |
|------------|--------------------|------------------|
| Repository | Model (checkpoint) | Repo             |
| Revision   | Model version      | Revsion / commit |

# Use it

```sh
# Scan an existing directory to build a manifest file
aimm scan
```

# To be implemented

```sh
# Initialize a new project
aimm init

# Install from Git
aimm install https://github.com/AUTOMATIC1111/stable-diffusion-webui

# Install a model from Civitai
aimm install https://civitai.com/models/7240/meinamix 

# Install a model to a specific place
aimm install https://civitai.com/models/7240/meinamix ./models/meinamix

# Install a Lora from Civitai, and automatically pair it with previews
aimm install https://civitai.com/models/13213

# Install a model from Hugging Face
aimm install https://huggingface.co/THUDM/chatglm-6b/blob/main/pytorch_model-00001-of-00008.bin

# Download a model by name
aimm install bloom

# Install from an existing amm.json
aimm install
aimm install -r non-default-named.amm.json
```

# License
MIT
