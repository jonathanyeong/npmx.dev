<script setup lang="ts">
const { data: posts } = await useAsyncData('blog-posts', () =>
  queryCollection('blog').where('draft', '<>', true).order('date', 'DESC').all(),
)

definePageMeta({
  name: 'blog',
  // alias: ['/:path(.*)*'],
})

useSeoMeta({
  title: () => $t('blog.title'),
  description: () => $t('blog.description'),
})
</script>

<template>
  <main class="container py-8 sm:py-12 w-full">
    <header class="mb-8 pb-8 border-b border-border">
      <div class="">I AM A MIGHTY HEADER</div>
    </header>

    <article class="flex flex-col gap-6">
      <div v-for="post in posts" :key="post.slug" class="p-4 border border-border rounded-lg">
        <h2 class="text-xl font-semibold">
          <NuxtLink :to="`/blog/${post.slug}`" class="text-primary hover:underline">
            {{ post.title }}
          </NuxtLink>
        </h2>
        <p class="text-muted-foreground">{{ post.excerpt }}</p>
      </div>
    </article>
  </main>
</template>

<style>
.container {
  background: var(--bg-red);
}
</style>
