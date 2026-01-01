import fs from "fs";
import path from "path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  author: string;
  category: string;
  tags: string[];
  image?: string;
  readingTime: string;
  content: string;
}

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  author: string;
  category: string;
  tags: string[];
  image?: string;
  readingTime: string;
}

function calculateReadingTime(content: string): string {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}

export async function getAllPosts(): Promise<BlogPostMeta[]> {
  // Check if blog directory exists
  if (!fs.existsSync(BLOG_DIR)) {
    return [];
  }

  const files = fs.readdirSync(BLOG_DIR).filter((file) => file.endsWith(".mdx"));

  const posts = files.map((file) => {
    const slug = file.replace(/\.mdx$/, "");
    const filePath = path.join(BLOG_DIR, file);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(fileContent);

    return {
      slug,
      title: data.title || "",
      description: data.description || "",
      publishedAt: data.publishedAt || "",
      updatedAt: data.updatedAt,
      author: data.author || "LessFussy Team",
      category: data.category || "Uncategorized",
      tags: data.tags || [],
      image: data.image,
      readingTime: calculateReadingTime(content),
    };
  });

  // Sort by published date (newest first)
  return posts.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export async function getPost(slug: string): Promise<BlogPost | null> {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContent);

  return {
    slug,
    title: data.title || "",
    description: data.description || "",
    publishedAt: data.publishedAt || "",
    updatedAt: data.updatedAt,
    author: data.author || "LessFussy Team",
    category: data.category || "Uncategorized",
    tags: data.tags || [],
    image: data.image,
    readingTime: calculateReadingTime(content),
    content,
  };
}

export async function getPostsByCategory(
  category: string
): Promise<BlogPostMeta[]> {
  const posts = await getAllPosts();
  return posts.filter(
    (post) => post.category.toLowerCase() === category.toLowerCase()
  );
}

export async function getPostsByTag(tag: string): Promise<BlogPostMeta[]> {
  const posts = await getAllPosts();
  return posts.filter((post) =>
    post.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
  );
}

export async function getRelatedPosts(
  currentSlug: string,
  limit = 3
): Promise<BlogPostMeta[]> {
  const currentPost = await getPost(currentSlug);
  if (!currentPost) return [];

  const allPosts = await getAllPosts();
  const otherPosts = allPosts.filter((post) => post.slug !== currentSlug);

  // Score posts by relevance (same category or shared tags)
  const scoredPosts = otherPosts.map((post) => {
    let score = 0;
    if (post.category === currentPost.category) score += 2;
    const sharedTags = post.tags.filter((tag) =>
      currentPost.tags.includes(tag)
    );
    score += sharedTags.length;
    return { ...post, score };
  });

  // Sort by score and return top matches
  return scoredPosts
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ ...post }) => post);
}

export function getAllCategories(): string[] {
  return ["Sleep", "Feeding", "Development", "Parenting"];
}

