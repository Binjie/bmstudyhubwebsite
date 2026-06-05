---
title: "Face Check-In"
description: "A browser-based face recognition attendance prototype inspired by real classroom check-ins, designed to show who has arrived without manual clicking."
summary: "A project story about turning a classroom attendance problem into a working face recognition demo, including registration, matching, threshold tuning, and teaching reflection."
date: 2023-10-01
category: "AI Prototype"
status: "Interactive Demo"
featured_image: "/images/showcase/facecheckin/face-check-in-logo.png"
materials:
  - "face-api.js"
  - "JavaScript"
  - "Webcam"
  - "Face embeddings"
tags:
  - "AI"
  - "Computer Vision"
  - "Prototype"
embed: true
embed_url: "/showcase/embed/welcomefaceapp/index.html"
demo_label: "Face Check-In Demo"
---

The idea for this project came from a very ordinary classroom moment: at the beginning of class, students need to check in, and the teacher needs to know who has arrived and who is still absent. The studio first imagined a simple computer-based check-in system where students could click their own names. That solved the paperwork problem, but it created a new design problem: if some students clicked randomly, the attendance record would no longer be reliable.

That small problem led to a more creative direction: could attendance happen automatically when a student appears in front of the camera? The prototype uses face-api.js to turn a familiar face into a numerical face descriptor, watch the webcam feed, and compare the live face against the saved example. You can open the working browser prototype here: [Face Check-In Demo](/showcase/embed/welcomefaceapp/index.html). The demo is intentionally simple, because its purpose is to make the core recognition flow visible and easy to teach.

The most interesting part was not making the camera turn on. It was learning how much judgment sits between "the computer found a face" and "the computer knows who this is." The system creates a compact embedding for each face, then compares the distance between embeddings. If the threshold is too strict, the same student may not be recognised when the lighting changes. If the threshold is too loose, the system may mark the wrong person as present. That tradeoff became a practical classroom discussion about testing, uncertainty, data quality, and responsible AI design.

The interface also changed several times. Early drafts tried to show too much model information on screen, which made the project feel like a debugging tool rather than an attendance assistant. Later versions reduced the screen to the important actions: load the model, start the webcam, identify the face, and display the recognition result. This made the function easier to understand and helped students connect the technical pipeline with a real classroom need.

As a functional idea, Face Check-In shows how an attendance workflow could move from manual clicking to automatic recognition, helping a teacher quickly see who is present and who is missing. As a teaching demo, it also turns the same feature into a lesson: students can see how face registration, matching, thresholds, false matches, privacy, and interface design all connect inside one small AI product. The value of the project is not only that it recognises faces, but that it turns a real classroom problem into a creative, discussable prototype.
