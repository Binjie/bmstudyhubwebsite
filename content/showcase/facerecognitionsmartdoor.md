---
title: "Face Recognition Smart Door"
description: "A real‑time face recognition system that greets registered users by name using 128‑dimensional embeddings"
date: 2023-10-01
embed: true
embed_url: "/showcase/embed/welcomefaceapp/index.html"

---

This project demonstrates how to build a face recognition application that identifies a person from a live camera feed and welcomes them personally. Users can register their face by uploading an image, which is converted into a unique 128‑dimensional numerical array (embedding). When the same face appears in front of the camera, the system matches the embedding and displays a “Welcome, [name]” message.

Features
Face registration – upload an image, extract a 128‑bit (float) embedding, and store it with a name.

Real‑time recognition – capture video from a webcam, detect faces, and compute their embeddings.

Similarity matching – compare live embeddings with registered ones using cosine distance.

Personalised greeting – when a match is found, show a welcome message with the person’s name.

How it works
Embedding extraction – a pre‑trained deep learning model (e.g. FaceNet or a similar CNN) converts a face image into a 128‑dimensional vector. This vector is a compact numerical representation of the face’s unique features.

Registration – the user’s name and their embedding are saved in a simple database (e.g. JSON file or in‑memory list).

Recognition loop – each frame from the camera is processed: faces are located, cropped, and passed through the same model to obtain an embedding. This embedding is compared against all registered embeddings. If the distance is below a threshold, the corresponding name is retrieved.

Output – the system overlays the welcome message on the video feed.

Technologies used
Python, OpenCV (face detection and camera handling)

TensorFlow / PyTorch (pre‑trained face recognition model)

NumPy & scikit‑learn (embedding storage and distance calculation)

Learning outcomes
Understand how neural networks convert images into meaningful numerical vectors.

Practise real‑time computer vision pipelines.

Explore similarity search and threshold tuning.

Integrate multiple components (image upload, camera, model inference) into a single application.

This case study was developed as part of an AI elective course. Students were challenged to deploy the system on a Raspberry Pi, creating a low‑cost smart door prototype. The project successfully combined deep learning, software engineering, and user‑centred design.

