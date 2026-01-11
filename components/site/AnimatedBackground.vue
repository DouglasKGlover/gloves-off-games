<template>
  <div class="background-blobs" aria-hidden="true">
    <span class="blob blob-pink"></span>
    <span class="blob blob-blue"></span>
    <span class="grain"></span>
  </div>
</template>

<script setup>
// No runtime JS needed; pure CSS animation
</script>

<style scoped lang="scss">
.background-blobs {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.blob {
  position: absolute;
  width: 90vw;
  height: 90vw;
  max-width: 120rem;
  max-height: 120rem;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.28;
  mix-blend-mode: screen;
  transform: translate3d(0, 0, 0);

  @media (min-width: 768px) {
    width: 70vw;
    height: 70vw;
    filter: blur(140px);
    animation: drift 40s ease-in-out infinite alternate;
  }
}

.blob-pink {
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 38, 183, 0.5),
    rgba(255, 38, 183, 0)
  );
  top: -20%;
  left: 10%;
  animation-duration: 44s;
  animation-delay: -6s;

  @media (min-width: 768px) {
    top: -10%;
    left: 40%;
  }
}

.blob-blue {
  background: radial-gradient(
    circle at 70% 70%,
    rgba(30, 144, 255, 0.46),
    rgba(30, 144, 255, 0)
  );
  top: 40%;
  left: -25%;
  animation-duration: 42s;
  animation-delay: -8s;

  @media (min-width: 768px) {
    top: 30%;
    left: -15%;
  }
}

.grain {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch"/></filter><rect width="128" height="128" filter="url(%23n)" opacity="0.16"/></svg>');
  background-size: 160px 160px;
  opacity: 0.035;
  mix-blend-mode: soft-light;
}

@keyframes drift {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(10%, -7%, 0) scale(1.06);
  }
  100% {
    transform: translate3d(-9%, 9%, 0) scale(1.04);
  }
}

@media (prefers-reduced-motion: reduce) {
  .blob {
    animation: none;
  }
}
</style>
