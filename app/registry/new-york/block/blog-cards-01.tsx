"use client"

import * as React from "react"
import { Eye, MessageCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/registry/new-york/ui/badge"
import { Button } from "@/registry/new-york/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/registry/new-york/ui/card"

interface BlogPost {
  id: string
  category: string
  title: string
  excerpt: string
  image: string
  views: string
  comments: number
}

const posts: BlogPost[] = [
  {
    id: "1",
    category: "TECHNOLOGY",
    title: "The Future of AI",
    excerpt:
      "Exploring the latest developments in artificial intelligence and machine learning technologies.",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop",
    views: "2.4K",
    comments: 12,
  },
  {
    id: "2",
    category: "DESIGN",
    title: "Modern UI Patterns",
    excerpt:
      "Discover the trending design patterns that are shaping modern user interfaces.",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=600&fit=crop",
    views: "1.8K",
    comments: 8,
  },
  {
    id: "3",
    category: "DEVELOPMENT",
    title: "Building Scalable Apps",
    excerpt:
      "Best practices for creating applications that scale efficiently with your user base.",
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=600&fit=crop",
    views: "3.1K",
    comments: 15,
  },
]

export default function BlockBlogCards01() {
  return (
    <section className="container px-4 py-24 mx-auto">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Card key={post.id} className="overflow-hidden">
            <div className="aspect-video w-full overflow-hidden">
              <img
                src={post.image}
                alt={post.title}
                className="h-full w-full object-cover transition-transform hover:scale-105"
              />
            </div>
            <CardHeader>
              <Badge variant="outline" className="w-fit">
                {post.category}
              </Badge>
              <CardTitle className="mt-2">{post.title}</CardTitle>
              <CardDescription>{post.excerpt}</CardDescription>
            </CardHeader>
            <CardFooter className="flex items-center justify-between">
              <Button variant="ghost" size="sm">
                Learn More
                <svg
                  className="ml-2 h-4 w-4"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="M12 5l7 7-7 7" />
                </svg>
              </Button>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {post.views}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  {post.comments}
                </span>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  )
}
