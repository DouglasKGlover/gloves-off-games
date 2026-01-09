<template>
  <header>
    <!-- <div class="container"> -->
    <nav class="container" :class="{ open: isMenuOpen }">
      <NuxtLink to="/" @click="isMenuOpen = false">Home</NuxtLink>
      <NuxtLink to="/systems/" @click="isMenuOpen = false">Systems</NuxtLink>
      <NuxtLink to="/games/" @click="isMenuOpen = false">Games</NuxtLink>
      <NuxtLink to="/stats/" @click="isMenuOpen = false">Stats</NuxtLink>
      <NuxtLink to="/gallery/" @click="isMenuOpen = false">Gallery</NuxtLink>
      <NuxtLink to="/glog/" @click="isMenuOpen = false">Glog</NuxtLink>
    </nav>

    <button
      class="hamburger"
      :class="{ active: isMenuOpen }"
      @click="isMenuOpen = !isMenuOpen"
      aria-label="Toggle menu"
    >
      <span></span>
      <span></span>
      <span></span>
    </button>
    <!-- </div> -->
  </header>
</template>

<script setup>
import { ref } from "vue";

const isMenuOpen = ref(false);
</script>

<style scoped lang="scss">
@use "sass:map";
@use "~/assets/css/breakpoints" as *;

header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  background: rgba(0, 0, 0, 0.25);
  padding: 1.5rem 5%;
  display: flex;
  justify-content: flex-end;
  z-index: var(--z-foreground);
}

.hamburger {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;

  span {
    display: block;
    width: 2.5rem;
    height: 0.3rem;
    background: white;
    border-radius: 0.15rem;
    transition: 0.3s ease;
  }

  &.active {
    span:nth-child(1) {
      transform: rotate(45deg) translate(0.6rem, 0.6rem);
    }
    span:nth-child(2) {
      opacity: 0;
    }
    span:nth-child(3) {
      transform: rotate(-45deg) translate(0.6rem, -0.6rem);
    }
  }

  @media (min-width: map.get($breakpoints, md)) {
    display: none;
  }
}

nav {
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  width: 100vw;
  padding: 20% 10%;
  display: flex;
  justify-content: center;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(5px);
  box-shadow: -30px 0 60px rgba(0, 0, 0, 0.8);
  transform: translateX(100%);
  display: flex;
  flex-direction: column;
  z-index: var(--z-foreground - 1);
  text-align: right;
  opacity: 0;
  transition: 0.3s ease;

  &.open {
    opacity: 1;
    transform: translateX(0);
  }

  a {
    font-size: var(--font-size-xxlarge);
    color: white;
    text-decoration: none;
    margin-bottom: 2rem;
    opacity: 0;
    transform: translateX(2rem);
    transition: 0.3s ease;
    transition-delay: 0s;

    &:hover {
      text-decoration: underline;
    }
  }

  @media (min-width: map.get($breakpoints, md)) {
    position: relative;
    width: 100%;
    height: auto;
    padding: 0 5%;
    background: none;
    box-shadow: none;
    opacity: 1;
    transform: none;
    flex-direction: row;
    justify-content: space-between;
    text-align: left;

    a {
      margin-bottom: 0;
      opacity: 1;
      transform: none;
      transition: none;
      display: block;
      padding: 1rem 2rem;
      position: relative;
      font-weight: 700;
      font-size: var(--font-size-large);
      transition: 0.2s ease;

      &:nth-child(1),
      &:nth-child(2),
      &:nth-child(3),
      &:nth-child(4),
      &:nth-child(5),
      &:nth-child(6) {
        transition-delay: 0s;
      }

      &::after {
        content: "";
        display: block;
        position: absolute;
        bottom: -0.2rem;
        left: 0;
        width: 100%;
        height: 3px;
        border-radius: 1.5px;
        background: var(--blue);
        box-shadow: 0 0 8px var(--blue);
        transform: translateY(0.5rem);
        opacity: 0;
        transition: 0.2s ease;
      }

      &:hover {
        text-decoration: none;
        text-shadow:
          0 10px 24px var(--blue),
          0 10px 32px var(--blue);

        &::after {
          opacity: 1;
          transform: translateY(0);
        }
      }
    }
  }

  &.open {
    a {
      opacity: 1;
      transform: translateX(0);

      &:nth-child(1) {
        transition-delay: 0.1s;
      }
      &:nth-child(2) {
        transition-delay: 0.2s;
      }
      &:nth-child(3) {
        transition-delay: 0.3s;
      }
      &:nth-child(4) {
        transition-delay: 0.4s;
      }
      &:nth-child(5) {
        transition-delay: 0.5s;
      }
      &:nth-child(6) {
        transition-delay: 0.6s;
      }
    }
  }
}
</style>
