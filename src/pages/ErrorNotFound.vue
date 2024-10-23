<template>
  <div class="error-not-found">
    <h1>404</h1>
    <h2>Oops. Nothing here...</h2>
    <router-link to="/">Go Home</router-link>
  </div>
</template>

<style scoped>
.error-not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
}

h1 {
  font-size: 10rem;
  margin-bottom: 0;
}

h2 {
  margin-top: 0;
  margin-bottom: 2rem;
}
</style>