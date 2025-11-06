import React from "react"
import { render, screen } from "@testing-library/react"
import { GridPattern, GridPatternPresets } from "../app/registry/default/ui/grid-pattern"

describe("GridPattern", () => {
  it("renders without crashing", () => {
    const { container } = render(<GridPattern />)
    const svg = container.querySelector("svg")
    expect(svg).toBeInTheDocument()
  })

  it("renders dots pattern by default", () => {
    const { container } = render(<GridPattern />)
    const circle = container.querySelector("circle")
    expect(circle).toBeInTheDocument()
  })

  it("renders lines pattern when specified", () => {
    const { container } = render(<GridPattern variant="lines" />)
    const lines = container.querySelectorAll("line")
    expect(lines.length).toBeGreaterThan(0)
  })

  it("renders crosses pattern when specified", () => {
    const { container } = render(<GridPattern variant="crosses" />)
    const lines = container.querySelectorAll("line")
    expect(lines.length).toBe(2)
  })

  it("renders plus pattern when specified", () => {
    const { container } = render(<GridPattern variant="plus" />)
    const path = container.querySelector("path")
    expect(path).toBeInTheDocument()
  })

  it("renders squares pattern when specified", () => {
    const { container } = render(<GridPattern variant="squares" />)
    const rect = container.querySelector("rect[fill='none']")
    expect(rect).toBeInTheDocument()
  })

  it("applies custom size", () => {
    const { container } = render(<GridPattern variant="dots" size={10} />)
    const circle = container.querySelector("circle")
    expect(circle?.getAttribute("r")).toBe("5")
  })

  it("applies custom gap", () => {
    const { container } = render(<GridPattern gap={50} />)
    const pattern = container.querySelector("pattern")
    expect(pattern?.getAttribute("width")).toBe("50")
    expect(pattern?.getAttribute("height")).toBe("50")
  })

  it("applies custom opacity", () => {
    const { container } = render(<GridPattern opacity={0.8} />)
    const circle = container.querySelector("circle")
    expect(circle?.getAttribute("opacity")).toBe("0.8")
  })

  it("applies fade mask when enabled", () => {
    const { container } = render(<GridPattern fade="edges" />)
    const gradients = container.querySelectorAll("linearGradient")
    expect(gradients.length).toBeGreaterThan(0)
  })

  it("applies gradient overlay", () => {
    const { container } = render(
      <GridPattern gradient={{ from: "#ff0000", to: "#0000ff" }} />
    )
    const gradients = container.querySelectorAll("linearGradient")
    expect(gradients.length).toBeGreaterThan(0)
  })

  it("applies presets correctly", () => {
    const { container } = render(<GridPattern {...GridPatternPresets.blueprint} />)
    const lines = container.querySelectorAll("line")
    expect(lines.length).toBeGreaterThan(0)
  })

  it("accepts custom className", () => {
    const { container } = render(<GridPattern className="custom-class" />)
    const div = container.firstChild
    expect(div).toHaveClass("custom-class")
  })

  it("forwards ref correctly", () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<GridPattern ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  it("applies animation styles when animation prop is provided", () => {
    const { container } = render(
      <GridPattern animation={{ duration: 5, timing: "ease-in" }} />
    )
    const div = container.firstChild as HTMLElement
    expect(div.style.animation).toContain("5s")
    expect(div.style.animation).toContain("ease-in")
  })

  it("applies offset transform", () => {
    const { container } = render(<GridPattern offset={{ x: 10, y: 20 }} />)
    const svg = container.querySelector("svg")
    expect(svg?.style.transform).toContain("translate(10px, 20px)")
  })

  it("handles custom size object", () => {
    const { container } = render(
      <GridPattern variant="squares" size={{ width: 20, height: 10 }} />
    )
    const rect = container.querySelector("rect[fill='none']")
    expect(rect?.getAttribute("width")).toBe("20")
    expect(rect?.getAttribute("height")).toBe("10")
  })

  it("handles custom gap object", () => {
    const { container } = render(<GridPattern gap={{ x: 30, y: 40 }} />)
    const pattern = container.querySelector("pattern")
    expect(pattern?.getAttribute("width")).toBe("30")
    expect(pattern?.getAttribute("height")).toBe("40")
  })
})