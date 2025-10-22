"use client";

import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, PenTool, Text, Square, Circle } from "lucide-react";
import { motion, Variants, useScroll, useTransform } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRouter } from "next/navigation";

gsap.registerPlugin(ScrollTrigger);

// Cursor component for the hero section
const Cursor = ({ name, color }: { name: string; color: string }) => (
  <div
    className="hero-cursor absolute flex items-center gap-2"
    style={{ color: color }}
  >
    <svg
      className="w-5 h-5"
      viewBox="0 0 20 20"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        d="M10.222 2.234a.75.75 0 01.928.326l4.25 7.5a.75.75 0 01-.632 1.14H5.232a.75.75 0 01-.632-1.14l4.25-7.5a.75.75 0 01.428-.326z"
        clipRule="evenodd"
        transform="rotate(-30 10 10)"
      />
    </svg>
    <div
      className="rounded-full px-3 py-1 text-sm font-semibold text-white shadow"
      style={{ backgroundColor: color }}
    >
      {name}
    </div>
  </div>
);

const InkLinkLanding = () => {
  const heroContainerRef = useRef(null);
  const heroPinRef = useRef(null);
  const infiniteCanvasRef = useRef(null);

  const router = useRouter();

  const cursorsData = [
    { name: "Alex", color: "#F59E0B" },
    { name: "Mia", color: "#10B981" },
    { name: "Leo", color: "#EF4444" },
    { name: "Chloe", color: "#8B5CF6" },
  ];

  // Natural cursor animation logic
  useEffect(() => {
    const hero = heroContainerRef.current;
    if (!hero) return;

    const cursors = gsap.utils.toArray(".hero-cursor");

    const animateCursor = (cursor: any) => {
      const heroBounds = (hero as HTMLElement).getBoundingClientRect();
      const containerWidth = heroBounds.width;
      const containerHeight = heroBounds.height;

      gsap.to(cursor, {
        x: Math.random() * (containerWidth - 150),
        y: Math.random() * (containerHeight - 80),
        duration: Math.random() * 6 + 7,
        ease: "sine.inOut",
        onComplete: () => animateCursor(cursor),
      });
    };

    cursors.forEach((cursor: any) => {
      const heroBounds = (hero as HTMLElement).getBoundingClientRect();
      gsap.set(cursor, {
        x: Math.random() * (heroBounds.width - 150),
        y: Math.random() * (heroBounds.height - 80),
      });
      animateCursor(cursor);
    });

    return () => {
      cursors.forEach((cursor: any) => gsap.killTweensOf(cursor));
    };
  }, []);

  // GSAP animation for the pinned board section
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: heroPinRef.current,
          start: "top top",
          end: "+=3000",
          scrub: 1.5,
          pin: true,
        },
        defaults: { ease: "power2.out" },
      });
      tl.from(".sticky-note", { opacity: 0, y: 60, stagger: 0.2 })
        .from(".flow-shape", { opacity: 0, scale: 0.8, stagger: 0.2 }, "-=0.2")
        .from(".flow-arrow", {
          opacity: 0,
          scaleX: 0,
          transformOrigin: "left",
          stagger: 0.2,
        })
        .from(".tool-island", { opacity: 0, y: 40 })
        .from(".canvas-cursor", { opacity: 0, scale: 0, stagger: 0.2 }, "-=0.2")
        .from(".comment-thread", { opacity: 0, x: 50 });
    }, heroPinRef);
    return () => ctx.revert();
  }, []);

  // Framer Motion scroll animation for the "infinite canvas" section
  const { scrollYProgress } = useScroll({
    target: infiniteCanvasRef,
    offset: ["start end", "end start"],
  });
  const y1 = useTransform(scrollYProgress, [0, 1], [-200, 200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [-100, 100]);

  // Framer Motion variants for section/item animations
  const sectionVariant: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: "easeOut", staggerChildren: 0.2 },
    },
  };
  const itemVariant: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: "easeOut" },
    },
  };

  return (
    <div className="font-jakarta bg-white text-gray-800">
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap");

        .font-jakarta {
          font-family: "Plus Jakarta Sans", sans-serif;
        }
      `}</style>

      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-200/80">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-12">
              <a href="#" className="flex items-center gap-3">

                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM15.5 8.5C15.5 9.33 14.83 10 14 10C13.17 10 12.5 9.33 12.5 8.5C12.5 7.67 13.17 7 14 7C14.83 7 15.5 7.67 15.5 8.5ZM8.5 15.5C8.5 16.33 7.83 17 7 17C6.17 17 5.5 16.33 5.5 15.5C5.5 14.67 6.17 14 7 14C7.83 14 8.5 14.67 8.5 15.5ZM12 17.5C10.5 17.5 9 17 7.5 16.5C7.3 16.4 7.1 16.2 6.9 16C6.7 15.8 6.5 15.6 6.3 15.4C5.7 14.7 5.2 13.9 4.9 13.1C4.6 12.3 4.5 11.5 4.5 10.7C4.5 8.6 6.1 7 8.2 7H15.8C17.9 7 19.5 8.6 19.5 10.7C19.5 11.5 19.4 12.3 19.1 13.1C18.8 13.9 18.3 14.7 17.7 15.4C17.5 15.6 17.3 15.8 17.1 16C16.9 16.2 16.7 16.4 16.5 16.5C15 17 13.5 17.5 12 17.5Z"
                    fill="#4F46E5"
                  />
                </svg>
                <span className="text-2xl font-bold text-gray-900">
                  InkLink
                </span>
              </a>
              <nav className="hidden lg:flex items-center gap-8">
                <a
                  href="#"
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  Templates
                </a>
                <a
                  href="#"
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  Resources
                </a>
                <a
                  href="#"
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  Pricing
                </a>
              </nav>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => router.push("/login")}
                variant="ghost"
                className="hidden md:inline-flex text-gray-600 hover:text-gray-900 hover:bg-gray-100 hover:cursor-pointer"
              >
                Sign in
              </Button>
              <Button
                onClick={() => router.push("/signup")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 transition-transform hover:scale-105 hover:cursor-pointer"
              >
                Sign up free
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section
          ref={heroContainerRef}
          className="relative min-h-screen flex items-center justify-center px-6 lg:px-8 text-center overflow-hidden"
        >
          <div className="absolute inset-0 z-10">
            {cursorsData.map((cursor) => (
              <Cursor
                key={cursor.name}
                name={cursor.name}
                color={cursor.color}
              />
            ))}
          </div>
          <motion.div
            className="relative z-20"
            initial="hidden"
            animate="visible"
            variants={sectionVariant}
          >
            <motion.h1
              variants={itemVariant}
              className="text-5xl lg:text-7xl font-extrabold text-gray-900 mb-6 leading-tight tracking-tighter"
            >
              Work together,
              <br />
              <span className="text-indigo-600">brilliantly</span>
            </motion.h1>
            <motion.p
              variants={itemVariant}
              className="text-lg lg:text-xl text-gray-600 mb-10 max-w-3xl mx-auto"
            >
              The visual workspace where teams come together to turn great ideas
              into reality.
            </motion.p>
            <motion.div variants={itemVariant}>
              <Button
                onClick={() => router.push("/login")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-lg px-8 py-6 rounded-full transition-transform hover:scale-105 shadow-lg shadow-indigo-200"
              >
                Get started free <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
          </motion.div>
        </section>

        <section ref={heroPinRef} className="px-6 lg:px-8 h-screen">
          <div className="max-w-7xl mx-auto h-full rounded-3xl overflow-hidden shadow-2xl shadow-gray-200 border border-gray-200/80 bg-gray-50 flex flex-col">
            <div className="bg-white/50 backdrop-blur-sm border-b border-gray-200/80 px-4 py-3 flex items-center gap-2 shrink-0">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <div className="flex-1 mx-4 bg-gray-100/80 rounded-lg px-4 py-1.5 text-sm text-gray-600">
                inklink.com/board/product-launch
              </div>
            </div>
            <div className="relative p-8 grow">
              <svg className="w-full h-full" viewBox="0 0 1200 600">
                <defs>
                  <pattern
                    id="grid-canvas"
                    width="100"
                    height="100"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 100 0 L 0 0 0 100"
                      fill="none"
                      stroke="#e0e0e0"
                      strokeWidth="1"
                    />
                  </pattern>
                </defs>
                <rect width="1200" height="600" fill="url(#grid-canvas)" />
                <g className="sticky-note" transform="translate(100, 80)">
                  <rect
                    width="160"
                    height="160"
                    rx="8"
                    fill="#FFF4A3"
                    filter="drop-shadow(0 4px 6px rgba(0,0,0,0.1))"
                    transform="rotate(-5 80 80)"
                  />
                  <text
                    x="80"
                    y="70"
                    textAnchor="middle"
                    fontSize="16"
                    fontWeight="600"
                    fill="#000"
                  >
                    User Research
                  </text>
                </g>
                <g className="sticky-note" transform="translate(280, 100)">
                  <rect
                    width="160"
                    height="160"
                    rx="8"
                    fill="#A7F3D0"
                    filter="drop-shadow(0 4px 6px rgba(0,0,0,0.1))"
                    transform="rotate(3 80 80)"
                  />
                  <text
                    x="80"
                    y="70"
                    textAnchor="middle"
                    fontSize="16"
                    fontWeight="600"
                    fill="#000"
                  >
                    Ideation
                  </text>
                </g>
                <g className="sticky-note" transform="translate(460, 90)">
                  <rect
                    width="160"
                    height="160"
                    rx="8"
                    fill="#BFDBFE"
                    filter="drop-shadow(0 4px 6px rgba(0,0,0,0.1))"
                    transform="rotate(-2 80 80)"
                  />
                  <text
                    x="80"
                    y="70"
                    textAnchor="middle"
                    fontSize="16"
                    fontWeight="600"
                    fill="#000"
                  >
                    Design
                  </text>
                </g>
                <g className="flow-shape" transform="translate(150, 350)">
                  <rect
                    width="200"
                    height="100"
                    rx="50"
                    fill="#6366F1"
                    stroke="black"
                    strokeWidth="2"
                  />
                  <text
                    x="100"
                    y="60"
                    textAnchor="middle"
                    fontSize="18"
                    fontWeight="600"
                    fill="white"
                  >
                    Define Problem
                  </text>
                </g>
                <g className="flow-shape" transform="translate(450, 350)">
                  <rect
                    width="200"
                    height="100"
                    rx="50"
                    fill="#8B5CF6"
                    stroke="black"
                    strokeWidth="2"
                  />
                  <text
                    x="100"
                    y="60"
                    textAnchor="middle"
                    fontSize="18"
                    fontWeight="600"
                    fill="white"
                  >
                    Prototype
                  </text>
                </g>
                <g className="flow-shape" transform="translate(750, 350)">
                  <rect
                    width="200"
                    height="100"
                    rx="50"
                    fill="#EC4899"
                    stroke="black"
                    strokeWidth="2"
                  />
                  <text
                    x="100"
                    y="60"
                    textAnchor="middle"
                    fontSize="18"
                    fontWeight="600"
                    fill="white"
                  >
                    Launch
                  </text>
                </g>
                <path
                  className="flow-arrow"
                  d="M 350 400 L 450 400"
                  stroke="#64748B"
                  strokeWidth="3"
                  markerEnd="url(#arrowhead)"
                />
                <path
                  className="flow-arrow"
                  d="M 650 400 L 750 400"
                  stroke="#64748B"
                  strokeWidth="3"
                  markerEnd="url(#arrowhead)"
                />
                <g className="canvas-cursor" transform="translate(320, 180)">
                  <circle r="8" fill="#3B82F6" />
                  <text
                    x="15"
                    y="5"
                    fontSize="12"
                    fontWeight="600"
                    fill="#3B82F6"
                  >
                    Sarah
                  </text>
                </g>
                <g className="canvas-cursor" transform="translate(580, 300)">
                  <circle r="8" fill="#10B981" />
                  <text
                    x="15"
                    y="5"
                    fontSize="12"
                    fontWeight="600"
                    fill="#10B981"
                  >
                    Mike
                  </text>
                </g>
                <g className="comment-thread" transform="translate(900, 120)">
                  <rect
                    width="220"
                    height="140"
                    rx="12"
                    fill="white"
                    stroke="#E5E7EB"
                    strokeWidth="1"
                    filter="drop-shadow(0 4px 6px rgba(0,0,0,0.1))"
                  />
                  <circle cx="30" cy="30" r="15" fill="#3B82F6" />
                  <text
                    x="55"
                    y="32"
                    fontSize="13"
                    fontWeight="600"
                    fill="#111827"
                  >
                    Sarah Chen
                  </text>
                  <text x="20" y="75" fontSize="12" fill="#374151">
                    This flow looks great!
                  </text>
                  <text x="20" y="92" fontSize="12" fill="#374151">
                    Let&apos;s add a testing phase.
                  </text>
                </g>
                <g className="tool-island" transform="translate(30, 500)">
                  <rect
                    x="0"
                    y="0"
                    width="220"
                    height="60"
                    rx="30"
                    fill="white"
                    filter="drop-shadow(0 10px 15px rgba(0,0,0,0.1))"
                  />
                  <g
                    transform="translate(20 20)"
                    className="opacity-70 hover:opacity-100 cursor-pointer"
                  >
                    <PenTool size={20} color="#1F2937" />
                  </g>
                  <g
                    transform="translate(70 20)"
                    className="opacity-70 hover:opacity-100 cursor-pointer"
                  >
                    <Text size={20} color="#1F2937" />
                  </g>
                  <g
                    transform="translate(120 20)"
                    className="opacity-70 hover:opacity-100 cursor-pointer"
                  >
                    <Square size={20} color="#1F2937" />
                  </g>
                  <g
                    transform="translate(170 20)"
                    className="opacity-70 hover:opacity-100 cursor-pointer"
                  >
                    <Circle size={20} color="#1F2937" />
                  </g>
                </g>
              </svg>
            </div>
          </div>
        </section>

        <section
          ref={infiniteCanvasRef}
          className="py-32 px-6 lg:px-8 bg-gray-50 relative overflow-hidden"
        >
          <div className="max-w-7xl mx-auto text-center relative z-10">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              An infinite canvas for boundless ideas
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Don&apos;t let your tools limit your team&apos;s potential. Pan, zoom, and
              explore a limitless space where every idea has room to grow,
              connect, and evolve.
            </p>
          </div>
          <motion.div
            style={{ y: y1 }}
            className="absolute top-10 left-1/4 w-48 h-32 bg-indigo-100 rounded-2xl"
          ></motion.div>
          <motion.div
            style={{ y: y2 }}
            className="absolute bottom-20 right-1/4 w-64 h-48 bg-purple-100 rounded-2xl"
          ></motion.div>
        </section>

        <motion.section
          className="py-32 px-6 lg:px-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={sectionVariant}
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Templates for any workflow
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Get a head start on your next project with a library of proven
                templates.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 transform hover:-translate-y-2 transition-transform">
                <h4 className="font-bold text-lg mb-2">Kanban Board</h4>
                <p className="text-sm text-gray-500 mb-4">
                  Visualize workflow and track tasks from to-do to done.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-center gap-3 h-56">
                  <div className="flex-1 space-y-2 self-start">
                    <div className="text-xs font-bold text-center">To Do</div>
                    <div className="w-full h-10 bg-white shadow-sm rounded-md border border-gray-200"></div>
                  </div>
                  <div className="flex-1 space-y-2 self-start">
                    <div className="text-xs font-bold text-center">
                      In Progress
                    </div>
                    <div className="w-full h-16 bg-white shadow-sm rounded-md p-2 space-y-1 border border-gray-200">
                      <div className="w-full h-2 bg-blue-300 rounded-full"></div>
                      <div className="w-2/3 h-2 bg-blue-300 rounded-full"></div>
                    </div>
                    <div className="w-full h-10 bg-white shadow-sm rounded-md border border-gray-200"></div>
                  </div>
                  <div className="flex-1 space-y-2 self-start">
                    <div className="text-xs font-bold text-center">Done</div>
                    <div className="w-full h-12 bg-white shadow-sm rounded-md border border-gray-200 opacity-60"></div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 transform hover:-translate-y-2 transition-transform">
                <h4 className="font-bold text-lg mb-2">Mind Map</h4>
                <p className="text-sm text-gray-500 mb-4">
                  Brainstorm and organize ideas in a non-linear, visual way.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-center h-56">
                  <svg viewBox="0 0 100 80" className="w-3/4 h-3/4">
                    <circle cx="50" cy="40" r="10" fill="#4F46E5" />
                    <line
                      x1="50"
                      y1="40"
                      x2="20"
                      y2="15"
                      stroke="#4F46E5"
                      strokeWidth="2"
                    />
                    <line
                      x1="50"
                      y1="40"
                      x2="80"
                      y2="65"
                      stroke="#4F46E5"
                      strokeWidth="2"
                    />
                    <line
                      x1="50"
                      y1="40"
                      x2="25"
                      y2="60"
                      stroke="#4F46E5"
                      strokeWidth="2"
                    />
                    <line
                      x1="20"
                      y1="15"
                      x2="5"
                      y2="25"
                      stroke="#A78BFA"
                      strokeWidth="2"
                    />
                    <circle cx="20" cy="15" r="5" fill="#A78BFA" />
                    <circle cx="80" cy="65" r="5" fill="#A78BFA" />
                    <circle cx="25" cy="60" r="5" fill="#A78BFA" />
                    <circle cx="5" cy="25" r="3" fill="#A78BFA" />
                  </svg>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 transform hover:-translate-y-2 transition-transform">
                <h4 className="font-bold text-lg mb-2">User Journey</h4>
                <p className="text-sm text-gray-500 mb-4">
                  Map out the user experience from first contact to conversion.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-center gap-1 h-56">
                  <div className="flex-1 flex flex-col items-center text-center">
                    <div className="w-8 h-8 bg-blue-200 rounded-full"></div>
                    <div className="text-xs mt-1 font-semibold">Discovery</div>
                    <p className="text-[10px] text-gray-500">
                      User finds out about the product.
                    </p>
                  </div>
                  <div className="flex-1 h-0.5 bg-gray-300"></div>
                  <div className="flex-1 flex flex-col items-center text-center">
                    <div className="w-8 h-8 bg-blue-200 rounded-full"></div>
                    <div className="text-xs mt-1 font-semibold">Onboarding</div>
                    <p className="text-[10px] text-gray-500">
                      User signs up and learns the UI.
                    </p>
                  </div>
                  <div className="flex-1 h-0.5 bg-gray-300"></div>
                  <div className="flex-1 flex flex-col items-center text-center">
                    <div className="w-8 h-8 bg-blue-200 rounded-full"></div>
                    <div className="text-xs mt-1 font-semibold">Conversion</div>
                    <p className="text-[10px] text-gray-500">
                      User subscribes to a paid plan.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <section className="py-24 bg-gray-50">
          <div className="max-w-5xl mx-auto text-center">
            <p className="text-base font-semibold text-gray-500 uppercase tracking-wider mb-10">
              Trusted by teams at
            </p>
            <div className="flex flex-wrap justify-center items-center gap-x-16 gap-y-8 text-gray-400">
              <p className="text-3xl font-bold tracking-tighter hover:text-gray-700 hover:cursor-pointer">Nexus</p>
              <p className="text-3xl font-bold tracking-tighter hover:text-gray-700 hover:cursor-pointer">ApexBuild</p>
              <p className="text-3xl font-bold tracking-tighter hover:text-gray-700 hover:cursor-pointer">Innovate Co</p>
              <p className="text-3xl font-bold tracking-tighter hover:text-gray-700 hover:cursor-pointer">Quantum</p>
              <p className="text-3xl font-bold tracking-tighter hover:text-gray-700 hover:cursor-pointer">Stellar</p>
            </div>
          </div>
        </section>

        <footer className="bg-gray-900 text-gray-400">
          <div className="max-w-7xl mx-auto py-16 px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-4">
                <a href="#" className="flex items-center gap-3 mb-4">

                  <svg
                    width="36"
                    height="36"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM15.5 8.5C15.5 9.33 14.83 10 14 10C13.17 10 12.5 9.33 12.5 8.5C12.5 7.67 13.17 7 14 7C14.83 7 15.5 7.67 15.5 8.5ZM8.5 15.5C8.5 16.33 7.83 17 7 17C6.17 17 5.5 16.33 5.5 15.5C5.5 14.67 6.17 14 7 14C7.83 14 8.5 14.67 8.5 15.5ZM12 17.5C10.5 17.5 9 17 7.5 16.5C7.3 16.4 7.1 16.2 6.9 16C6.7 15.8 6.5 15.6 6.3 15.4C5.7 14.7 5.2 13.9 4.9 13.1C4.6 12.3 4.5 11.5 4.5 10.7C4.5 8.6 6.1 7 8.2 7H15.8C17.9 7 19.5 8.6 19.5 10.7C19.5 11.5 19.4 12.3 19.1 13.1C18.8 13.9 18.3 14.7 17.7 15.4C17.5 15.6 17.3 15.8 17.1 16C16.9 16.2 16.7 16.4 16.5 16.5C15 17 13.5 17.5 12 17.5Z"
                      fill="white"
                    />
                  </svg>
                  <span className="text-xl font-bold text-white">InkLink</span>
                </a>
                <p className="text-sm max-w-xs">
                  The visual workspace for brilliant ideas.
                </p>
              </div>
              <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                  <h4 className="text-white font-semibold mb-4">Product</h4>
                  <ul className="space-y-3 text-sm">
                    <li>
                      <a
                        href="#"
                        className="hover:text-white transition-colors"
                      >
                        Features
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="hover:text-white transition-colors"
                      >
                        Templates
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="hover:text-white transition-colors"
                      >
                        Pricing
                      </a>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-4">Company</h4>
                  <ul className="space-y-3 text-sm">
                    <li>
                      <a
                        href="#"
                        className="hover:text-white transition-colors"
                      >
                        About
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="hover:text-white transition-colors"
                      >
                        Careers
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="hover:text-white transition-colors"
                      >
                        Contact
                      </a>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-4">Resources</h4>
                  <ul className="space-y-3 text-sm">
                    <li>
                      <a
                        href="#"
                        className="hover:text-white transition-colors"
                      >
                        Blog
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="hover:text-white transition-colors"
                      >
                        Help Center
                      </a>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-4">Legal</h4>
                  <ul className="space-y-3 text-sm">
                    <li>
                      <a
                        href="#"
                        className="hover:text-white transition-colors"
                      >
                        Privacy
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="hover:text-white transition-colors"
                      >
                        Terms
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm text-gray-500">
              <p>
                &copy; {new Date().getFullYear()} InkLink. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default InkLinkLanding;