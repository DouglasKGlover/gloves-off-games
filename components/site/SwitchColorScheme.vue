<template>
  <button
    @click="switchColorScheme()"
    name="theme"
    aria-label="switch light and dark theme"
  ></button>
</template>

<script setup>
const colorScheme = ref("light");

const switchColorScheme = () => {
  if (colorScheme.value == "light") {
    colorScheme.value = "dark";
  } else {
    colorScheme.value = "light";
  }
};

onMounted(() => {
  const savedColorScheme = localStorage.getItem("color-scheme");
  if (savedColorScheme) {
    colorScheme.value = savedColorScheme;
  }
});

watch(colorScheme, (newScheme) => {
  switch (newScheme) {
    case "dark":
      // Dark Scheme
      document.documentElement.style.setProperty("--foreground", "#ddd");
      document.documentElement.style.setProperty("--foreground-darker", "#eee");
      document.documentElement.style.setProperty("--background", "#222");
      document.documentElement.style.setProperty(
        "--background-lighter",
        "#111",
      );
      document.documentElement.style.setProperty("--highlight", "#000");
      localStorage.setItem("color-scheme", newScheme);
      break;
    case "light":
      // Light Scheme
      document.documentElement.style.setProperty("--foreground", "#333");
      document.documentElement.style.setProperty("--foreground-darker", "#111");
      document.documentElement.style.setProperty("--background", "#ddd");
      document.documentElement.style.setProperty(
        "--background-lighter",
        "#eee",
      );
      document.documentElement.style.setProperty("--highlight", "#fff");
      localStorage.setItem("color-scheme", newScheme);
      break;
  }
});
</script>

<style lang="scss" scoped>
button {
  position: relative;
  width: 15px;
  height: 15px;
  display: inline-block;
  border-radius: 50%;
  background: var(--foreground);
  overflow: hidden;
  border: 0;
  box-shadow: 1px 0 0 var(--foreground);

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 50%;
    width: 15px;
    height: 15px;
    display: inline-block;
    border-radius: 50%;
    background: var(--background);
    transition: 0.5s ease;
  }

  &:hover {
    &::after {
      content: "";
      transform: translateX(3px);
    }
  }
}
</style>
