import { StableDiffusionApi } from "stable-diffusion-api";


async function main() {
    const api = new StableDiffusionApi({
        baseUrl: "https://tuegtqwoeab9ud-3000.proxy.runpod.net",
    });

    await api.setOptions({
        // "sd_model_checkpoint": "SDv1-5.ckpt [4c86efd062]",
        "sd_model_checkpoint": "anime/meinamix_meinaV9.safetensors [eac6c08a19]",
    })

    const result = await api.txt2img({
        prompt: "realistic and intricate details, masterpiece, 1girl, Chinese, purple silk dress, butterfly, night, moon, magic, ribbons, dramatic pose, stars, serious look, (hand fan), fine details, (dance), anime",
        negative_prompt: "(worst quality, low quality:1.4), (fuze:1.4), (worst quality:1.1), (low quality:1.4:1.1), lowres, bad anatomy, text,(deformed:1.3),(malformed hands:1.4),(poorly drawn hands:1.4),(mutated fingers:1.4),(bad anatomy:1.3),(extra limbs:1.35),(poorly drawn face:1.4),(signature:1.2),(artist name:1.2),(watermark:1.2), (wrong fingers)",
        sampler_name: "DPM++ 2M Karras",
        steps: 20,
        seed: 12345678,
        cfg_scale: 7,

    })

    await result.image.toFile('result.png')
}

main();
