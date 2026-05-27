---
title: Components Showcase
date: 2026-05-28
tags: [docs, components]
---

# 🧩 Component Library Showcase

Mofuri now supports a wide range of UI components based on Element Plus.

## 📐 Layout Components

<m-row gutter="20">
  <m-col span="12">
    <m-card header="Column 1">
      <p>This is inside a 12-span column.</p>
    </m-card>
  </m-col>
  <m-col span="12">
    <m-card header="Column 2">
      <p>This is inside another 12-span column.</p>
    </m-card>
  </m-col>
</m-row>

<m-divider>Timeline Example</m-divider>

## ⏳ Timeline

<m-timeline>
  <m-timeline-item timestamp="2026-05-28" type="success">
    Component library expanded.
  </m-timeline-item>
  <m-timeline-item timestamp="2026-05-27" type="primary">
    Initial setup completed.
  </m-timeline-item>
</m-timeline>

<m-divider>Steps Example</m-divider>

## 🪜 Steps

<m-steps active="1">
  <m-step-item title="Step 1" description="Initialize project" />
  <m-step-item title="Step 2" description="Develop components" />
</m-steps>
