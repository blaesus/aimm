import { promises as fs } from "fs";
import { Txt2ImgParams, WebuiCheckpoint, WebuiOptions } from "./webui-types";

export interface WebUiApiRequester {
    txt2img(params: Partial<Txt2ImgParams>, outputPath?: string): Promise<boolean>;
    setCheckpointWithTitle(checkpointTitle: string): Promise<void>;
    getCheckpoints(): Promise<WebuiCheckpoint[]>;
    setOptions(params: Partial<WebuiOptions>): Promise<void>;
    refreshCheckpoints(): Promise<void>;
}

const defaultParams: Txt2ImgParams = {
    prompt: "",
    negative_prompt: "",
    seed: 12345678,
    subseed: 12345678,
    sampler_name: "DPM++ 2M Karras",
    steps: 20,
    cfg_scale: 7,
    width: 512,
    height: 512,

    seed_resize_from_h: -1,
    seed_resize_from_w: -1,

    enable_hr: false,
    denoising_strength: 0,
    firstphase_width: 0,
    firstphase_height: 0,
    hr_scale: 2,
    hr_upscaler: undefined,
    hr_second_pass_steps: 0,
    hr_resize_x: 0,
    hr_resize_y: 0,
    styles: undefined,
    subseed_strength: 0,
    batch_size: 1,
    n_iter: 1,
    restore_faces: false,
    tiling: false,
    do_not_save_samples: false,
    do_not_save_grid: false,
    eta: undefined,
    s_churn: 0,
    s_tmax: undefined,
    s_tmin: 0,
    s_noise: 1,
    override_settings: undefined,
    override_settings_restore_afterwards: true,
    script_args: [],
    sampler_index: "Euler",
    script_name: undefined,
    send_images: true,
    save_images: false,
    alwayson_scripts: {},
};

const defaultOptions: WebuiOptions = {
    "samples_save": true,
    "samples_format": "png",
    "samples_filename_pattern": "",
    "save_images_add_number": true,
    "grid_save": true,
    "grid_format": "png",
    "grid_extended_filename": false,
    "grid_only_if_multiple": true,
    "grid_prevent_empty_spots": false,
    "n_rows": -1.0,
    "enable_pnginfo": true,
    "save_txt": false,
    "save_images_before_face_restoration": false,
    "save_images_before_highres_fix": false,
    "save_images_before_color_correction": false,
    "save_mask": false,
    "save_mask_composite": false,
    "jpeg_quality": 80.0,
    "webp_lossless": false,
    "export_for_4chan": true,
    "img_downscale_threshold": 4.0,
    "target_side_length": 4000.0,
    "img_max_size_mp": 200.0,
    "use_original_name_batch": true,
    "use_upscaler_name_as_suffix": false,
    "save_selected_only": true,
    "do_not_add_watermark": false,
    "temp_dir": "",
    "clean_temp_dir_at_start": false,
    "outdir_samples": "",
    "outdir_txt2img_samples": "outputs/txt2img-images",
    "outdir_img2img_samples": "outputs/img2img-images",
    "outdir_extras_samples": "outputs/extras-images",
    "outdir_grids": "",
    "outdir_txt2img_grids": "outputs/txt2img-grids",
    "outdir_img2img_grids": "outputs/img2img-grids",
    "outdir_save": "log/images",
    "save_to_dirs": true,
    "grid_save_to_dirs": true,
    "use_save_to_dirs_for_ui": false,
    "directories_filename_pattern": "[date]",
    "directories_max_prompt_words": 8.0,
    "ESRGAN_tile": 192.0,
    "ESRGAN_tile_overlap": 8.0,
    "realesrgan_enabled_models": [
        "R-ESRGAN 4x+",
        "R-ESRGAN 4x+ Anime6B",
    ],
    "upscaler_for_img2img": null,
    "face_restoration_model": "CodeFormer",
    "code_former_weight": 0.5,
    "face_restoration_unload": false,
    "show_warnings": false,
    "memmon_poll_rate": 8.0,
    "samples_log_stdout": false,
    "multiple_tqdm": true,
    "print_hypernet_extra": false,
    "unload_models_when_training": false,
    "pin_memory": false,
    "save_optimizer_state": false,
    "save_training_settings_to_txt": true,
    "dataset_filename_word_regex": "",
    "dataset_filename_join_string": " ",
    "training_image_repeats_per_epoch": 1.0,
    "training_write_csv_every": 500.0,
    "training_xattention_optimizations": false,
    "training_enable_tensorboard": false,
    "training_tensorboard_save_images": false,
    "training_tensorboard_flush_every": 120.0,
    "sd_model_checkpoint": "SDv1-5.ckpt [4c86efd062]",
    "sd_checkpoint_cache": 0.0,
    "sd_vae_checkpoint_cache": 0.0,
    "sd_vae": "Automatic",
    "sd_vae_as_default": true,
    "inpainting_mask_weight": 1.0,
    "initial_noise_multiplier": 1.0,
    "img2img_color_correction": false,
    "img2img_fix_steps": false,
    "img2img_background_color": "#ffffff",
    "enable_quantization": false,
    "enable_emphasis": true,
    "enable_batch_seeds": true,
    "comma_padding_backtrack": 20.0,
    "CLIP_stop_at_last_layers": 1.0,
    "upcast_attn": false,
    "use_old_emphasis_implementation": false,
    "use_old_karras_scheduler_sigmas": false,
    "no_dpmpp_sde_batch_determinism": false,
    "use_old_hires_fix_width_height": false,
    "interrogate_keep_models_in_memory": false,
    "interrogate_return_ranks": false,
    "interrogate_clip_num_beams": 1.0,
    "interrogate_clip_min_length": 24.0,
    "interrogate_clip_max_length": 48.0,
    "interrogate_clip_dict_limit": 1500.0,
    "interrogate_clip_skip_categories": [],
    "interrogate_deepbooru_score_threshold": 0.5,
    "deepbooru_sort_alpha": true,
    "deepbooru_use_spaces": false,
    "deepbooru_escape": true,
    "deepbooru_filter_tags": "",
    "extra_networks_default_view": "cards",
    "extra_networks_default_multiplier": 1.0,
    "extra_networks_card_width": 0.0,
    "extra_networks_card_height": 0.0,
    "extra_networks_add_text_separator": " ",
    "sd_hypernetwork": "None",
    "return_grid": true,
    "return_mask": false,
    "return_mask_composite": false,
    "do_not_show_images": false,
    "add_model_hash_to_info": true,
    "add_model_name_to_info": true,
    "disable_weights_auto_swap": true,
    "send_seed": true,
    "send_size": true,
    "font": "",
    "js_modal_lightbox": true,
    "js_modal_lightbox_initially_zoomed": true,
    "show_progress_in_title": true,
    "samplers_in_dropdown": true,
    "dimensions_and_batch_together": true,
    "keyedit_precision_attention": 0.1,
    "keyedit_precision_extra": 0.05,
    "quicksettings": "sd_model_checkpoint",
    "hidden_tabs": [],
    "ui_reorder": "inpaint, sampler, checkboxes, hires_fix, dimensions, cfg, seed, batch, override_settings, scripts",
    "ui_extra_networks_tab_reorder": "",
    "localization": "None",
    "show_progressbar": true,
    "live_previews_enable": true,
    "show_progress_grid": true,
    "show_progress_every_n_steps": 10.0,
    "show_progress_type": "Approx NN",
    "live_preview_content": "Prompt",
    "live_preview_refresh_period": 1000.0,
    "hide_samplers": [],
    "eta_ddim": 0.0,
    "eta_ancestral": 1.0,
    "ddim_discretize": "uniform",
    "s_churn": 0.0,
    "s_tmin": 0.0,
    "s_noise": 1.0,
    "eta_noise_seed_delta": 0.0,
    "always_discard_next_to_last_sigma": false,
    "uni_pc_variant": "bh1",
    "uni_pc_skip_type": "time_uniform",
    "uni_pc_order": 3.0,
    "uni_pc_lower_order_final": true,
    "postprocessing_enable_in_main_ui": [],
    "postprocessing_operation_order": [],
    "upscaling_max_images_in_cache": 5.0,
    "disabled_extensions": [],
    "disable_all_extensions": "none",
    "sd_checkpoint_hash": "c0d1994c73d784a17a5b335ae8bda02dcc8dd2fc5f5dbf55169d5aab385e53f2",
};

function resultSuccessful(result: Txt2ImgResult): result is Txt2ImgSuccess {
    return !!(result as Txt2ImgSuccess).images;
}

export function getWebuiApiRequester(base: string): WebUiApiRequester {
    const requester: WebUiApiRequester = {
        async txt2img(params: Partial<Txt2ImgParams>, outputPath?: string): Promise<boolean> {
            const url = `${base}/sdapi/v1/txt2img`;
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...defaultParams,
                    ...params,
                }),
            });

            try {
                const data: Txt2ImgResult = await response.json();
                console.info(data)
                if (resultSuccessful(data)) {
                    if (outputPath) {
                        const imageBase64 = data.images[0];
                        const imageBinary = Buffer.from(imageBase64, "base64");
                        await fs.writeFile(outputPath, imageBinary);
                    }
                    return true
                }
                return false;
            }
            catch {
                return false;
            }
        },
        async setCheckpointWithTitle(checkpoint: string): Promise<void> {
            return requester.setOptions({
                sd_model_checkpoint: checkpoint,
            })
        },
        async getCheckpoints() {
            const url = `${base}/sdapi/v1/sd-models`;
            const response = await fetch(url);
            return response.json()
        },
        async refreshCheckpoints() {
            const url = `${base}/sdapi/v1/refresh-checkpoints`;
            const response = await fetch(url, {
                method: "POST",
            });
            return response.json()
        },
        async setOptions(params: Partial<WebuiOptions>): Promise<void> {
            const url = `${base}/sdapi/v1/options`;
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(params),
            });
            const error = await response.json();
            if (error) {
                console.error("set options error", error)
            }
        },
    };

    return requester;
}

interface Txt2ImgSuccess {
    images: string[],
    parameters: Txt2ImgParams
    info: string,
}

interface Txt2ImgError {
    error: string,
    detail: string,
    body: string,
    errors: string,
}

export type Txt2ImgResult = Txt2ImgSuccess | Txt2ImgError;
