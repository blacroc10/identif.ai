from cog import BasePredictor, Input, Path
from pipeline import get_negative

class Predictor(BasePredictor):

    def setup(self):
        import os
        import torch
        from diffusers import StableDiffusionPipeline, DPMSolverMultistepScheduler, AutoencoderKL
        from gfpgan.utils import GFPGANer

        self.torch = torch

        # Loads once when container starts
        print("Loading VAE...")
        vae = AutoencoderKL.from_pretrained(
            "stabilityai/sd-vae-ft-mse",
            torch_dtype=self.torch.float16
        )

        print("Loading Realistic Vision V5.1...")
        local_model = "./Realistic_Vision_V5.1_fp16-no-ema.safetensors"
        if os.path.isfile(local_model):
            self.pipe = StableDiffusionPipeline.from_single_file(
                local_model,
                torch_dtype=self.torch.float16,
                safety_checker=None,
                vae=vae,
            )
        else:
            # Fallback for Cog builds where large local checkpoints are not in Docker context.
            self.pipe = StableDiffusionPipeline.from_pretrained(
                "SG161222/Realistic_Vision_V5.1_noVAE",
                torch_dtype=self.torch.float16,
                safety_checker=None,
                vae=vae,
            )
        self.pipe.scheduler = DPMSolverMultistepScheduler.from_config(
            self.pipe.scheduler.config,
            use_karras_sigmas=True,
            algorithm_type="dpmsolver++"
        )
        self.pipe.to("cuda")                # GPU — not CPU
        self.pipe.enable_xformers_memory_efficient_attention()
        self.pipe.enable_attention_slicing()

        print("Loading GFPGAN restorer...")
        self.restorer = GFPGANer(
            model_path="./gfpgan/weights/GFPGANv1.4.pth",
            upscale=1,
            arch="clean",
            channel_multiplier=2,
            bg_upsampler=None,
        )
        print("All models ready.")

    def predict(
        self,
        prompt: str = Input(
            description="Text prompt OR pass 'asr' to use audio file"
        ),
        negative_prompt: str = Input(
            description="What to avoid",
            default=""
        ),
        seed: int = Input(
            description="Seed for reproducibility (-1 = random)",
            default=-1
        ),
        num_inference_steps: int = Input(
            description="Steps — 30 is ideal on A4000",
            default=35, ge=20, le=50
        ),
        guidance_scale: float = Input(
            description="Prompt adherence — 7.5 is sweet spot",
            default=7.5, ge=1.0, le=15.0
        ),
    ) -> Path:

        # Seed
        from PIL import Image
        import numpy as np

        seed_val  = seed if seed != -1 else self.torch.randint(0, 99999, (1,)).item()
        generator = self.torch.Generator("cuda").manual_seed(seed_val)

        # If negative prompt not supplied use smart gender-aware one
        if not negative_prompt.strip():
            negative_prompt = get_negative({})

        # Generate
        with self.torch.autocast("cuda", dtype=self.torch.float16):
            image = self.pipe(
                prompt             = prompt,
                negative_prompt    = negative_prompt,
                generator          = generator,
                num_inference_steps= num_inference_steps,
                guidance_scale     = guidance_scale,
                height             = 512,
                width              = 512,
            ).images[0]

        # GFPGAN restore — fixes deformed eyes / asymmetry
        import cv2, numpy as np
        img_bgr = np.array(image)[:, :, ::-1]
        _, _, restored = self.restorer.enhance(
            img_bgr,
            has_aligned      = False,
            only_center_face = True,
            paste_back       = True,
        )
        image = Image.fromarray(restored[:, :, ::-1])

        output_path = "/tmp/output.png"
        image.save(output_path)
        return Path(output_path)