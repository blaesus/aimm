# AIMM

AI Model Manager.

## Terminology

| AIMM       | Civitai            | HuggingFace      |
|------------|--------------------|------------------|
| Repository | Model (checkpoint) | Repo             |
| Revision   | Model version      | Revsion / commit |

## Use it

```sh
# Scan an existing directory to build a manifest file
aimm scan

# Install packages from aimm.json
aimm install

# Install a package from a download link (to `.`)
aimm install https://civitai.com/api/download/models/46137

# Install a package from a download link (to a specific place)
aimm install https://civitai.com/api/download/models/46137 models/Stable-diffusion
```

## To be implemented for MVP

### Cli

```sh

# Smart install (install to appropriate place, e.g. models/Lora, download previews, etc.)
aimm si https://civitai.com/models/13213

# Or, in short:
aimm install --smart https://civitai.com/models/13213

# Initialize a new project
aimm init

# Install from Git
aimm install https://github.com/AUTOMATIC1111/stable-diffusion-webui

# Install a model from Civitai web page
aimm install https://civitai.com/models/7240/meinamix 

# Install a Lora from Civitai, and automatically pair it with previews
aimm install https://civitai.com/models/13213

# Install a model from Hugging Face
aimm install https://huggingface.co/THUDM/chatglm-6b/blob/main/pytorch_model-00001-of-00008.bin

# Download a model by name
aimm install bloom

# Install from an existing amm.json
aimm install
aimm install -r non-default-named.amm.json

# Move packages under aimm management:
aimm mv a b
```



## The API service

No authentication required at the moment. Please play nice.

`hashA` is the sha256 of the file.

Projects/repos have UUIDs as IDS in AIMM.
Civitai IDs are ints (e.g. `models/7204`), while HuggingFace uses strings (e.g. `lmsys/vicuna-7b-delta-v0`).

### 1. Files

#### 1.1 Search files by filename (partial)

```
https://api.aimm.dev/files?filename=meina&pretty=1
```

```json
[
    {
        "id": "7b1393c5-e398-4bc4-b416-3f2b3ac24165",
        "hashA": "e03274b1e7478ce7cfd86e4758d9918d26f6f1f73a6e37d425587a7938ac6f79",
        "downloadUrl": "https://civitai.com/api/download/models/16925",
        "filename": "meinamix_meinaV7.safetensors",
        "revision": {
            "id": "c02e9d09-f7cf-49c1-a44e-00a03b0918ed",
            "idInRegistry": "16925",
            "repo": {
                "id": "876abe0f-b774-4629-bcc8-024b2250a374",
                "name": "MeinaMix",
                "registry": "Civitai",
                "idInRegistry": "7240",
                "favour": 102479
            }
        }
    },
    {
        "id": "b4a7b957-f830-4c86-831e-cde04128f767",
        "hashA": "eac6c08a199c4953f80ae5b4ea5f9b2d88c7f3c6f2546e14a57851e3e4a1c5cb",
        "downloadUrl": "https://civitai.com/api/download/models/46137",
        "filename": "meinamix_meinaV9.safetensors",
        "revision": {
            "id": "1f726859-a61a-4df1-9057-20e869f0a54d",
            "idInRegistry": "46137",
            "repo": {
                "id": "876abe0f-b774-4629-bcc8-024b2250a374",
                "name": "MeinaMix",
                "registry": "Civitai",
                "idInRegistry": "7240",
                "favour": 102479
            }
        }
    },
]
```

### Search files by sha256 (must provide full)

# License
MIT
