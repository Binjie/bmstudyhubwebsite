---
title: "The Brachistochrone Curve: The Fastest Way Down"
date: 2026-06-08
description: "A student-friendly introduction to the brachistochrone curve, the cycloid that gives the fastest frictionless descent under gravity."
summary: "The shortest path is not always the fastest path. The brachistochrone explains why a curve that drops steeply first can beat a straight ramp."
category: "Mathematics"
field: "Calculus of Variations"
audience: "Middle school and above"
featured_image: "/images/home-math-background.png"
tags: ["brachistochrone", "cycloid", "gravity", "calculus", "history of mathematics"]
math: true
---

## The Fastest Path Down

The brachistochrone is the curve of fastest descent under a specific ideal condition: an object slides without friction between two points while gravity is the only force doing the work.

Imagine a small bead sliding from a higher point to a lower point. If the bead can choose any smooth track between the two points, which track gets it there in the least time?

The surprising answer is not a straight line. It is a cycloid: the curve traced by a point on the rim of a rolling wheel.

## What the Animation Shows

<iframe class="brachistochrone-demo" src="/knowledge/embed/brachistochrone.html" title="Brachistochrone animation comparing descent paths" loading="lazy"></iframe>

The three tracks have the same start and finish:

- the yellow line is the shortest distance
- the green curve is a smooth rounded path
- the purple curve is the brachistochrone

The purple path wins because it drops more sharply at the beginning. That early drop gives the bead speed quickly. After that, the bead is already moving fast while it travels through the rest of the curve.

## Why the Straight Line Loses

A straight ramp is the shortest distance, but it does not give the bead a strong early push. The brachistochrone drops steeply at the beginning, so gravity quickly converts height into speed. After that early acceleration, the bead carries more speed through the rest of the trip.

This is the main lesson:

- shortest distance is a geometry question
- shortest time is a motion question
- motion depends on speed, not only distance

The fastest path is willing to travel a little farther if that extra distance helps it become fast sooner.

## The Problem Behind the Story

The word "solved" can be confusing here. The mathematicians were not solving for one number. They were solving for a whole curve.

The question was:

<div class="knowledge-callout">
  <strong>Find the shape of the track that makes the travel time as small as possible.</strong>
  <span>The start point and finish point are fixed. Gravity is fixed. The unknown is the path between them.</span>
</div>

The story becomes clearer if we follow the mathematics in the order a solver might discover it.

Galileo had already studied falling motion and guessed that a circular arc might be the fastest curve. That guess was reasonable: a circle is smooth, simple, and drops quickly. But it was not the final answer.

Johann Bernoulli sharpened the question in 1696. He asked mathematicians to find the curve that minimizes travel time. The first ingredient is speed. If the bead has fallen a vertical distance $y$, conservation of energy gives:

$$
v=\sqrt{2gy}
$$

Read it like this:

- $v$ means speed
- $g$ means gravity
- $y$ means how far the bead has dropped vertically
- $\sqrt{\phantom{x}}$ means square root

The important part is not the square root itself. The important part is this: when $y$ becomes bigger, $v$ becomes bigger. In ordinary words, the lower the bead has fallen, the faster it is moving.

That explains why the purple curve begins by dropping steeply. It quickly makes $y$ large, so the bead gains speed early.

But speed alone is not enough. The bead also has to travel along the track. Imagine cutting the track into many tiny pieces. For one tiny piece:

$$
\Delta t=\frac{\Delta s}{v}
$$

This is just the familiar idea:

$$
\text{time}=\frac{\text{distance}}{\text{speed}}
$$

Using the speed formula above, the tiny time becomes:

$$
\Delta t=\frac{\Delta s}{\sqrt{2gy}}
$$

Now add all the tiny times along the whole track:

$$
T\approx \sum \frac{\Delta s}{\sqrt{2gy}}
$$

Here $\sum$ means "add them all." This version is easier to read before calculus. Later, mathematicians write the same idea with an integral:

$$
T=\int \frac{ds}{\sqrt{2gy}}
$$

So Bernoulli's challenge becomes a precise question: which curve makes this total time $T$ as small as possible?

The answer found by Bernoulli, Newton, Leibniz, L'Hopital, and Jakob Bernoulli was the same: the curve is a cycloid. A cycloid can be written with one moving angle, usually called $\theta$:

$$
x=a(\theta-\sin\theta)
$$

$$
y=a(1-\cos\theta)
$$

Here $a$ controls the size of the curve, and $\theta$ is the angle that changes as the wheel rolls. This is the same kind of curve traced by a dot on the rim of a rolling wheel.

## A Helpful Video

3Blue1Brown has a beautiful visual explanation of this problem. The video below starts near the section that connects the motion idea to the brachistochrone curve.

<div class="video-embed">
  <iframe src="https://www.youtube-nocookie.com/embed/Cld0p3a43fU?start=94" title="3Blue1Brown explanation of the brachistochrone problem" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
</div>

## Who Asked It? Who Solved It?

Galileo studied related falling-body questions earlier and suspected that a circular arc might be especially fast. The famous brachistochrone challenge, however, came from Johann Bernoulli in 1696.

Bernoulli asked European mathematicians to find the curve of quickest descent. Several major mathematicians answered the challenge. The important result was that the winning curve is not a line or a circular arc. It is a cycloid.

<div class="scientist-timeline">
  <article>
    <img src="/images/knowledge/brachistochrone/johann-bernoulli.jpg" alt="Portrait of Johann Bernoulli">
    <div>
      <span>1696 - The Challenge</span>
      <h3>Johann Bernoulli</h3>
      <p>He posed the problem publicly: find the curve that makes the total travel time smallest. He also gave a solution showing that the curve is a cycloid.</p>
    </div>
  </article>
  <article>
    <img src="/images/knowledge/brachistochrone/jakob-bernoulli.jpg" alt="Portrait of Jakob Bernoulli">
    <div>
      <span>Independent Solution</span>
      <h3>Jakob Bernoulli</h3>
      <p>Johann's brother also solved the problem. His work helped make the question part of a larger mathematical idea: optimizing a whole curve, not just finding one best number.</p>
    </div>
  </article>
  <article>
    <img src="/images/knowledge/brachistochrone/gottfried-leibniz.jpg" alt="Portrait of Gottfried Wilhelm Leibniz">
    <div>
      <span>Calculus Enters</span>
      <h3>Gottfried Wilhelm Leibniz</h3>
      <p>Leibniz solved the problem using the new language of calculus. This connected the physical idea of speed with the mathematical idea of adding tiny time intervals along a path.</p>
    </div>
  </article>
  <article>
    <img src="/images/knowledge/brachistochrone/guillaume-lhopital.jpg" alt="Portrait of Guillaume de l'Hopital">
    <div>
      <span>Another Answer</span>
      <h3>Guillaume de l'Hopital</h3>
      <p>L'Hopital was also among the mathematicians who answered Bernoulli's challenge. His involvement shows how quickly the question spread through the calculus community.</p>
    </div>
  </article>
  <article>
    <img src="/images/knowledge/brachistochrone/isaac-newton.jpg" alt="Portrait of Isaac Newton">
    <div>
      <span>The Famous Reply</span>
      <h3>Isaac Newton</h3>
      <p>Newton reportedly solved the problem very quickly after receiving it. His answer confirmed the same curve: the cycloid, now understood as the brachistochrone.</p>
    </div>
  </article>
</div>

## Why the Cycloid Wins

A cycloid is made by a point on a rolling circle. If you mark a dot on a bicycle wheel and roll the wheel forward, the dot rises, falls, and traces a looping curve.

For the brachistochrone, we use a downward-opening part of a cycloid. It starts very steep, then gradually flattens as it approaches the destination.

That shape explains the physics:

- a steep start builds speed quickly
- a smoother finish keeps the bead moving efficiently
- the whole path balances distance and acceleration

## Life Example

Roller coasters often begin with a dramatic drop. The goal is not only to move downward; it is to gain speed early so the car can carry energy through later curves, hills, and turns.

Real roller coasters must also consider safety, comfort, friction, wheels, supports, braking, and passengers. They are not pure brachistochrone tracks. But the intuition is similar: a path that drops strongly at first can create speed faster than a gentle straight descent.

## Sources

- [Encyclopaedia Britannica, "Brachistochrone"](https://www.britannica.com/science/brachistochrone)
- [Wolfram MathWorld, "Brachistochrone Problem"](https://mathworld.wolfram.com/BrachistochroneProblem.html)
- [3Blue1Brown, brachistochrone video explanation](https://www.youtube.com/watch?v=Cld0p3a43fU&t=94s)
- Portraits from Wikimedia Commons public-domain image files for Johann Bernoulli, Isaac Newton, Gottfried Wilhelm Leibniz, Jakob Bernoulli, and Guillaume de l'Hopital
