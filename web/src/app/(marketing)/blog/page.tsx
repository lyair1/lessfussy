import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts, getAllCategories } from "@/lib/blog";
import { formatDistanceToNow } from "date-fns";
import { Clock, ArrowRight, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Baby Care Blog - Tips, Guides & Expert Advice | LessFussy",
  description:
    "Expert advice on baby sleep schedules, feeding guides, developmental milestones, and parenting tips. Free resources for new and experienced parents.",
  openGraph: {
    title: "Baby Care Blog - Tips, Guides & Expert Advice | LessFussy",
    description:
      "Expert advice on baby sleep, feeding, development, and parenting.",
    type: "website",
  },
};

export default async function BlogPage() {
  const posts = await getAllPosts();
  const categories = getAllCategories();

  // Get featured post (first post)
  const featuredPost = posts[0];
  const remainingPosts = posts.slice(1);

  return (
    <>
      {/* Hero Section */}
      <section className="pt-24 pb-12 md:pt-32 md:pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Baby Care Blog
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Expert advice, practical tips, and helpful guides for parents at every stage.
            </p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="pb-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/blog">
              <Button variant="secondary" size="sm" className="rounded-full">
                All Posts
              </Button>
            </Link>
            {categories.map((category) => (
              <Link key={category} href={`/blog/category/${category.toLowerCase()}`}>
                <Button variant="outline" size="sm" className="rounded-full">
                  {category}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg mb-4">
                No blog posts yet. Check back soon!
              </p>
              <Link href="/">
                <Button>Back to Home</Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Featured Post */}
              {featuredPost && (
                <div className="mb-12">
                  <Link href={`/blog/${featuredPost.slug}`} className="group block">
                    <article className="bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/50 transition-colors">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="aspect-video bg-secondary flex items-center justify-center">
                          {featuredPost.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={featuredPost.image}
                              alt={featuredPost.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-muted-foreground">Featured Image</div>
                          )}
                        </div>
                        <div className="p-6 md:p-8 flex flex-col justify-center">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                              Featured
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {featuredPost.category}
                            </span>
                          </div>
                          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                            {featuredPost.title}
                          </h2>
                          <p className="text-muted-foreground mb-4 line-clamp-2">
                            {featuredPost.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {featuredPost.readingTime}
                            </div>
                            <span>
                              {formatDistanceToNow(new Date(featuredPost.publishedAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>
                  </Link>
                </div>
              )}

              {/* Post Grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {remainingPosts.map((post) => (
                  <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
                    <article className="bg-card rounded-xl border border-border overflow-hidden h-full hover:border-primary/50 transition-colors">
                      <div className="aspect-video bg-secondary flex items-center justify-center">
                        {post.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={post.image}
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-muted-foreground text-sm">
                            {post.category}
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <Tag className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {post.category}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {post.description}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {post.readingTime}
                          </div>
                          <span className="flex items-center gap-1 text-primary group-hover:underline">
                            Read more <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 bg-card/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Get Parenting Tips in Your Inbox
            </h2>
            <p className="text-muted-foreground mb-6">
              Subscribe to our newsletter for weekly tips, guides, and resources.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button className="font-semibold">Subscribe</Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              No spam, ever. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

