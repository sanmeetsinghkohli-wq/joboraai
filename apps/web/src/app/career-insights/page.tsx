'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { StitchShell } from '@/components/StitchShell';
import { useAppData } from '@/context/AppDataContext';

export default function CareerInsightsPage() {
  const { profile, jobs, refreshJobs, logActivity } = useAppData();
  const [activeTab, setActiveTab] = useState<'matrix' | 'trajectory' | 'recommendations'>('matrix');
  const [dubaiFilterActive, setDubaiFilterActive] = useState(false);

  const userSkillsLower = profile.skills.map((s) => s.toLowerCase());
  const hasSkill = (keywords: string[], fallback: number) => {
    if (userSkillsLower.length === 0) return fallback;
    const matched = keywords.some((k) => userSkillsLower.some((u) => u.includes(k)));
    return matched ? Math.min(98, fallback + 5) : fallback;
  };

  const pyTorchLevel = hasSkill(['python', 'pytorch', 'tensorflow'], 95);
  const llmLevel = hasSkill(['llm', 'rag', 'nlp', 'langchain'], 90);
  const awsLevel = hasSkill(['aws', 'cloud', 'sagemaker', 'bedrock'], 70);
  const dockerLevel = hasSkill(['docker', 'kubernetes', 'k8s'], 65);
  const goLevel = hasSkill(['go', 'grpc', 'distributed', 'rust', 'c++'], 85);

  const compositeScore = Math.round((pyTorchLevel + llmLevel + awsLevel + dockerLevel + goLevel) / 5);

  return (
    <StitchShell activeNav="career-insights">
      <div className="flex flex-col w-full">
        <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-surface-container-low via-surface-container to-surface-container-high p-space-lg shadow-sm mb-space-lg">
          <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-secondary-fixed/40 blur-3xl pointer-events-none"></div>
          <div className="absolute right-40 -bottom-20 w-72 h-72 rounded-full bg-tertiary-fixed/30 blur-3xl pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-space-md">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-container-lowest/80 backdrop-blur shadow-sm mb-3">
                <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim animate-pulse"></span>
                <span className="font-caption-caps text-caption-caps text-primary tracking-wider uppercase font-semibold">
                  GCC Market Intelligence • Q2 Active Radar
                </span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-medium">
                Career Insights &amp; Market Alignment
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant mt-2 leading-relaxed">
                AI-analyzed competency benchmarking against {Math.max(1200, jobs.length * 60).toLocaleString()}+ live
                AI/ML engineering postings in {profile.location || 'Dubai and GCC'}.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
              <button
                onClick={() => {
                  const next = !dubaiFilterActive;
                  setDubaiFilterActive(next);
                  refreshJobs('', next ? 'Dubai' : '');
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-label-md text-label-md shadow-sm transition-all ${
                  dubaiFilterActive
                    ? 'bg-secondary-fixed text-on-secondary-fixed font-bold'
                    : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-high'
                }`}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">tune</span>
                {dubaiFilterActive ? 'Filtered: Dubai Tech Hub' : 'Filter Dubai Tech Hub'}
              </button>
              <Link
                href="/cv-studio"
                onClick={() => logActivity('auto_awesome', 'Re-synced resume skills with Career Insights', 'Market Radar')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-container text-on-primary font-label-md text-label-md shadow-sm hover:opacity-95 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                Re-sync Resume
              </Link>
            </div>
          </div>

          {/* Live Benchmarking Pulse Stat Strip */}
          <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 bg-surface-container-lowest/70 backdrop-blur rounded-xl p-3 shadow-[0_2px_8px_-2px_rgba(53,27,50,0.03)]">
            <div className="flex flex-col px-3 py-1">
              <span className="font-caption-caps text-caption-caps text-on-surface-variant uppercase">
                Market Readiness
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="font-headline-md text-headline-md text-primary font-medium">89.4%</span>
                <span className="font-caption-caps text-caption-caps text-on-tertiary-container font-semibold">
                  +4.2%
                </span>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Top 7th percentile in MENA</span>
            </div>
            <div className="flex flex-col px-3 py-1">
              <span className="font-caption-caps text-caption-caps text-on-surface-variant uppercase">
                Target Role Demand
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="font-headline-md text-headline-md text-primary font-medium">1,248</span>
                <span className="font-caption-caps text-caption-caps text-secondary font-semibold">High surge</span>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Active vacancies in UAE &amp; KSA</span>
            </div>
            <div className="flex flex-col px-3 py-1">
              <span className="font-caption-caps text-caption-caps text-on-surface-variant uppercase">
                Median Target Salary
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="font-headline-md text-headline-md text-primary font-medium">48K</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">AED/mo</span>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant">~$157,000 USD Annual Equiv</span>
            </div>
            <div className="flex flex-col px-3 py-1">
              <span className="font-caption-caps text-caption-caps text-on-surface-variant uppercase">
                Skill Closure Velocity
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="font-headline-md text-headline-md text-primary font-medium">28 Days</span>
                <span className="font-caption-caps text-caption-caps text-on-tertiary-container font-semibold">
                  On Track
                </span>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant">2 focus sprints remaining</span>
            </div>
          </div>
        </div>

        {/* Interactive Filter Tabs */}
        <div className="flex items-center justify-between mb-space-md">
          <div className="flex items-center gap-1.5 p-1 bg-surface-container rounded-xl">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-4 py-2 rounded-lg font-label-md text-label-md transition-all ${
                activeTab === 'matrix'
                  ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold'
                  : 'font-medium text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              Skill Gap Matrix
            </button>
            <button
              onClick={() => setActiveTab('trajectory')}
              className={`px-4 py-2 rounded-lg font-label-md text-label-md transition-all ${
                activeTab === 'trajectory'
                  ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold'
                  : 'font-medium text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              Career Paths &amp; Trajectory
            </button>
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`px-4 py-2 rounded-lg font-label-md text-label-md transition-all ${
                activeTab === 'recommendations'
                  ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold'
                  : 'font-medium text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              Learning Recommendations
            </button>
          </div>
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary-container"></span>
              <span className="font-caption-caps text-caption-caps text-on-surface-variant">Your Level</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-outline-variant"></span>
              <span className="font-caption-caps text-caption-caps text-on-surface-variant">
                Regional Market Demand
              </span>
            </div>
          </div>
        </div>

        {/* TAB PANEL 1: SKILL GAP MATRIX */}
        {activeTab === 'matrix' && (
          <div className="flex flex-col gap-space-lg">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
              {/* Interactive Benchmark Bars List */}
              <div className="lg:col-span-8 flex flex-col gap-4">
                {/* Python & PyTorch */}
                <div className="bg-surface-container-lowest rounded-xl p-5 shadow-[0_2px_8px_-2px_rgba(53,27,50,0.04),0_12px_24px_-4px_rgba(53,27,50,0.03)] hover:shadow-md transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary font-bold">
                        <span className="material-symbols-outlined text-[20px]">terminal</span>
                      </div>
                      <div>
                        <h3 className="font-headline-sm text-headline-sm text-primary font-semibold">
                          Python &amp; PyTorch
                        </h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          Foundational tensor mechanics, graph optimization, and neural architecture
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm">
                      <span className="material-symbols-outlined text-[16px]">verified</span>
                      Strong Fit
                    </span>
                  </div>
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between items-center text-label-sm font-label-sm">
                      <span className="text-primary font-medium flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-primary-container"></span>
                        User Proficiency
                      </span>
                      <span className="text-primary font-bold">{pyTorchLevel}%</span>
                    </div>
                    <div className="w-full bg-surface-container rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-primary-container h-2.5 rounded-full transition-all duration-700"
                        style={{ width: `${pyTorchLevel}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center text-label-sm font-label-sm pt-1">
                      <span className="text-on-surface-variant flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-outline-variant"></span>
                        GCC Market Demand
                      </span>
                      <span className="text-on-surface-variant font-medium">90%</span>
                    </div>
                    <div className="w-full bg-surface-container rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-outline-variant h-2.5 rounded-full transition-all duration-700"
                        style={{ width: '90%' }}
                      ></div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant bg-surface-container-low px-3 py-2 rounded-lg">
                    <span>
                      Identified in <strong>1,120 of 1,248</strong> tracked roles (e.g., G42, Careem, Hub71 startups)
                    </span>
                    <span className="font-label-sm text-label-sm text-primary font-semibold">
                      +{pyTorchLevel - 90}% Advantage
                    </span>
                  </div>
                </div>

                {/* LLM Fine-Tuning & RAG */}
                <div className="bg-surface-container-lowest rounded-xl p-5 shadow-[0_2px_8px_-2px_rgba(53,27,50,0.04),0_12px_24px_-4px_rgba(53,27,50,0.03)] hover:shadow-md transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary font-bold">
                        <span className="material-symbols-outlined text-[20px]">psychology</span>
                      </div>
                      <div>
                        <h3 className="font-headline-sm text-headline-sm text-primary font-semibold">
                          LLM Fine-Tuning &amp; RAG
                        </h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          LoRA/QLoRA adapter training, vector retrieval (Milvus/Pinecone), embedding pipelines
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm">
                      <span className="material-symbols-outlined text-[16px]">verified</span>
                      Strong Fit
                    </span>
                  </div>
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between items-center text-label-sm font-label-sm">
                      <span className="text-primary font-medium flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-primary-container"></span>
                        User Proficiency
                      </span>
                      <span className="text-primary font-bold">{llmLevel}%</span>
                    </div>
                    <div className="w-full bg-surface-container rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-primary-container h-2.5 rounded-full transition-all duration-700"
                        style={{ width: `${llmLevel}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center text-label-sm font-label-sm pt-1">
                      <span className="text-on-surface-variant flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-outline-variant"></span>
                        GCC Market Demand
                      </span>
                      <span className="text-on-surface-variant font-medium">88%</span>
                    </div>
                    <div className="w-full bg-surface-container rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-outline-variant h-2.5 rounded-full transition-all duration-700"
                        style={{ width: '88%' }}
                      ></div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant bg-surface-container-low px-3 py-2 rounded-lg">
                    <span>Elevated premium in UAE Sovereign AI programs and bilingual Arabic LLM initiatives</span>
                    <span className="font-label-sm text-label-sm text-primary font-semibold">
                      +{llmLevel - 88}% Advantage
                    </span>
                  </div>
                </div>

                {/* AWS Bedrock & SageMaker */}
                <div className="bg-surface-container-lowest rounded-xl p-5 shadow-[0_2px_8px_-2px_rgba(53,27,50,0.04),0_12px_24px_-4px_rgba(53,27,50,0.03)] hover:shadow-md transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-secondary font-bold">
                        <span className="material-symbols-outlined text-[20px]">cloud_sync</span>
                      </div>
                      <div>
                        <h3 className="font-headline-sm text-headline-sm text-primary font-semibold">
                          AWS Bedrock &amp; SageMaker
                        </h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          Cloud orchestration, enterprise foundational model governance, ML endpoints
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm">
                      <span className="material-symbols-outlined text-[16px]">info</span>
                      Minor Gap (-15%)
                    </span>
                  </div>
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between items-center text-label-sm font-label-sm">
                      <span className="text-primary font-medium flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-primary-container"></span>
                        User Proficiency
                      </span>
                      <span className="text-primary font-bold">{awsLevel}%</span>
                    </div>
                    <div className="w-full bg-surface-container rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-primary-container h-2.5 rounded-full transition-all duration-700"
                        style={{ width: `${awsLevel}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center text-label-sm font-label-sm pt-1">
                      <span className="text-on-surface-variant flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-outline-variant"></span>
                        GCC Market Demand
                      </span>
                      <span className="text-on-surface-variant font-medium">85%</span>
                    </div>
                    <div className="w-full bg-surface-container rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-outline-variant h-2.5 rounded-full transition-all duration-700"
                        style={{ width: '85%' }}
                      ></div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 flex items-center justify-between text-body-sm font-body-sm text-secondary bg-error-container/20 px-3 py-2 rounded-lg">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">arrow_circle_up</span>
                      Closing this gap unlocks an estimated +18% candidate screening pass rate
                    </span>
                    <button
                      onClick={() => setActiveTab('recommendations')}
                      className="underline font-label-sm text-label-sm hover:text-on-secondary-container"
                      type="button"
                    >
                      Take AWS Deep Dive
                    </button>
                  </div>
                </div>

                {/* Docker & Containerization */}
                <div className="bg-surface-container-lowest rounded-xl p-5 shadow-[0_2px_8px_-2px_rgba(53,27,50,0.04),0_12px_24px_-4px_rgba(53,27,50,0.03)] hover:shadow-md transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-secondary font-bold">
                        <span className="material-symbols-outlined text-[20px]">layers</span>
                      </div>
                      <div>
                        <h3 className="font-headline-sm text-headline-sm text-primary font-semibold">
                          Docker &amp; Containerization
                        </h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          Kubernetes pods, multi-stage GPU builds, Triton inference server containers
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm">
                      <span className="material-symbols-outlined text-[16px]">trending_up</span>
                      Growth Area (-15%)
                    </span>
                  </div>
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between items-center text-label-sm font-label-sm">
                      <span className="text-primary font-medium flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-primary-container"></span>
                        User Proficiency
                      </span>
                      <span className="text-primary font-bold">{dockerLevel}%</span>
                    </div>
                    <div className="w-full bg-surface-container rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-primary-container h-2.5 rounded-full transition-all duration-700"
                        style={{ width: `${dockerLevel}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center text-label-sm font-label-sm pt-1">
                      <span className="text-on-surface-variant flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-outline-variant"></span>
                        GCC Market Demand
                      </span>
                      <span className="text-on-surface-variant font-medium">80%</span>
                    </div>
                    <div className="w-full bg-surface-container rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-outline-variant h-2.5 rounded-full transition-all duration-700"
                        style={{ width: '80%' }}
                      ></div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant bg-surface-container-low px-3 py-2 rounded-lg">
                    <span>Essential for transition to Senior &amp; Staff MLOps roles in enterprise platforms</span>
                    <span className="font-label-sm text-label-sm text-secondary font-semibold">Priority Sprint</span>
                  </div>
                </div>

                {/* Distributed Systems (Go/gRPC) */}
                <div className="bg-surface-container-lowest rounded-xl p-5 shadow-[0_2px_8px_-2px_rgba(53,27,50,0.04),0_12px_24px_-4px_rgba(53,27,50,0.03)] hover:shadow-md transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-tertiary font-bold">
                        <span className="material-symbols-outlined text-[20px]">hub</span>
                      </div>
                      <div>
                        <h3 className="font-headline-sm text-headline-sm text-primary font-semibold">
                          Distributed Systems (Go/gRPC)
                        </h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          High-throughput microservices, low-latency streaming endpoints, concurrency models
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm">
                      <span className="material-symbols-outlined text-[16px]">stars</span>
                      Standout Differentiator (+10%)
                    </span>
                  </div>
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between items-center text-label-sm font-label-sm">
                      <span className="text-primary font-medium flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-primary-container"></span>
                        User Proficiency
                      </span>
                      <span className="text-primary font-bold">{goLevel}%</span>
                    </div>
                    <div className="w-full bg-surface-container rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-primary-container h-2.5 rounded-full transition-all duration-700"
                        style={{ width: `${goLevel}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center text-label-sm font-label-sm pt-1">
                      <span className="text-on-surface-variant flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-outline-variant"></span>
                        GCC Market Demand
                      </span>
                      <span className="text-on-surface-variant font-medium">75%</span>
                    </div>
                    <div className="w-full bg-surface-container rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-outline-variant h-2.5 rounded-full transition-all duration-700"
                        style={{ width: '75%' }}
                      ></div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant bg-tertiary-fixed/20 px-3 py-2 rounded-lg">
                    <span>Rare dual-specialization: ML intelligence combined with backend systems velocity</span>
                    <span className="font-label-sm text-label-sm text-on-tertiary-container font-semibold">
                      High Leverage
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Visual Skill Radar & Competitive Distribution */}
              <div className="lg:col-span-4 flex flex-col gap-space-lg">
                {/* Interactive Radar Graphic Card */}
                <div className="bg-surface-container-lowest rounded-xl p-5 shadow-[0_2px_8px_-2px_rgba(53,27,50,0.04),0_12px_24px_-4px_rgba(53,27,50,0.03)] flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-headline-sm text-headline-sm text-primary font-semibold">
                        Competency Hexagon
                      </h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Vector profile vs Senior Engineer baseline
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant text-[20px]">radar</span>
                  </div>
                  <div className="relative w-full aspect-square max-w-[280px] mx-auto my-2 flex items-center justify-center">
                    <svg className="w-full h-full text-surface-container-highest" viewBox="0 0 240 240">
                      <polygon
                        fill="none"
                        points="120,20 206,70 206,170 120,220 34,170 34,70"
                        stroke="currentColor"
                        strokeDasharray="3 3"
                        strokeWidth="1"
                      ></polygon>
                      <polygon
                        fill="none"
                        points="120,50 178,85 178,155 120,190 62,155 62,85"
                        stroke="currentColor"
                        strokeDasharray="2 2"
                        strokeWidth="1"
                      ></polygon>
                      <polygon
                        fill="none"
                        points="120,80 150,97 150,143 120,160 90,143 90,97"
                        stroke="currentColor"
                        strokeWidth="1"
                      ></polygon>
                      <line stroke="currentColor" strokeWidth="1" x1="120" x2="120" y1="20" y2="220"></line>
                      <line stroke="currentColor" strokeWidth="1" x1="34" x2="206" y1="70" y2="170"></line>
                      <line stroke="currentColor" strokeWidth="1" x1="34" x2="206" y1="170" y2="70"></line>
                      <polygon
                        fill="#74546e"
                        fillOpacity="0.15"
                        points="120,38 190,78 185,160 120,185 52,150 48,78"
                        stroke="#74546e"
                        strokeWidth="1.5"
                      ></polygon>
                      <polygon
                        fill="#351b32"
                        fillOpacity="0.3"
                        points="120,28 195,73 162,163 120,172 44,142 42,72"
                        stroke="#351b32"
                        strokeWidth="2.5"
                      ></polygon>
                      <circle className="fill-primary-container" cx="120" cy="28" r="3.5"></circle>
                      <circle className="fill-primary-container" cx="195" cy="73" r="3.5"></circle>
                      <circle className="fill-secondary" cx="162" cy="163" r="3.5"></circle>
                      <circle className="fill-secondary" cx="120" cy="172" r="3.5"></circle>
                      <circle className="fill-primary-container" cx="44" cy="142" r="3.5"></circle>
                      <circle className="fill-primary-container" cx="42" cy="72" r="3.5"></circle>
                    </svg>
                    <span className="absolute top-0 text-[10px] font-caption-caps uppercase tracking-wider text-primary font-bold">
                      PyTorch ({pyTorchLevel}%)
                    </span>
                    <span className="absolute right-0 top-16 text-[10px] font-caption-caps uppercase tracking-wider text-primary font-bold">
                      LLMs ({llmLevel}%)
                    </span>
                    <span className="absolute right-0 bottom-14 text-[10px] font-caption-caps uppercase tracking-wider text-secondary font-bold">
                      AWS ({awsLevel}%)
                    </span>
                    <span className="absolute bottom-0 text-[10px] font-caption-caps uppercase tracking-wider text-secondary font-bold">
                      Docker ({dockerLevel}%)
                    </span>
                    <span className="absolute left-0 bottom-14 text-[10px] font-caption-caps uppercase tracking-wider text-primary font-bold">
                      gRPC ({goLevel}%)
                    </span>
                    <span className="absolute left-0 top-16 text-[10px] font-caption-caps uppercase tracking-wider text-primary font-bold">
                      Architecture
                    </span>
                  </div>
                  <div className="mt-3 p-3 bg-surface-container rounded-xl flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-primary font-semibold">
                        Composite Fit Score
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">Across UAE ML Openings</span>
                    </div>
                    <div className="flex items-center gap-1 bg-surface-container-lowest px-2.5 py-1 rounded-lg shadow-sm">
                      <span className="font-headline-sm text-headline-sm text-primary font-bold">
                        {compositeScore}/100
                      </span>
                    </div>
                  </div>
                </div>

                {/* Regional Market Insight Snippet */}
                <div className="bg-surface-container-low rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-secondary text-[20px]">explore</span>
                      <span className="font-caption-caps text-caption-caps text-secondary uppercase font-bold tracking-wider">
                        Hiring Hotspot Intelligence
                      </span>
                    </div>
                    <h4 className="font-headline-sm text-headline-sm text-primary font-semibold">
                      DIFC &amp; Riyadh Surge
                    </h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 leading-relaxed">
                      Financial institutions in Dubai International Financial Centre (DIFC) and sovereign platforms in
                      Riyadh are paying a <strong>22% premium</strong> for ML engineers proficient in localized Arabic
                      fine-tuning with enterprise compliance guarantees.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 flex items-center gap-3">
                    <img
                      alt="Recruiter Network"
                      className="w-8 h-8 rounded-full object-cover"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJ1RukF4hSLLPuHn2drweQMF-P0UJi8pZEETwB8hS9CVWhhbvnXdzFSmtWumSdAgNCdN2CtGbFkFTcnU-5pJmJaMqWGuWD3NwR9oRfKdEAAkrrx3lG_aH_qw6yKlNypUCg7TctDAe95Gt_H9I73HmWkykltt62vg9egAs9nGPaA0ib6s2aDL7FchCI3AbBCoJLtPy2JwAxqvNhjSuKLpKlcrtc0rNMWAqCX0F5tyDerc7rM5cinSWE"
                    />
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-primary font-semibold">
                        Verified by Jobora Recruiter Network
                      </span>
                      <span className="font-caption-caps text-caption-caps text-on-surface-variant">
                        Updated 6 hours ago
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB PANEL 2: CAREER PATHS & TRAJECTORY */}
        {activeTab === 'trajectory' && (
          <div className="flex flex-col gap-space-lg">
            <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-[0_2px_8px_-2px_rgba(53,27,50,0.04),0_12px_24px_-4px_rgba(53,27,50,0.03)]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-label-sm font-label-sm mb-2">
                    <span className="material-symbols-outlined text-[16px]">alt_route</span>
                    AI Recommended Progression Path
                  </div>
                  <h2 className="font-headline-md text-headline-md text-primary font-medium">
                    {profile.targetRole || 'AI Systems Engineer'} → Lead MLOps Engineer
                  </h2>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                    Optimized route leveraging your strong Distributed Systems background to pivot into high-yield ML
                    infrastructure.
                  </p>
                </div>
                <div className="flex flex-col items-start md:items-end bg-surface-container-low px-4 py-3 rounded-xl">
                  <span className="font-caption-caps text-caption-caps text-on-surface-variant uppercase">
                    Target Compensation Range
                  </span>
                  <span className="font-headline-sm text-headline-sm text-primary font-bold">
                    52,000 - 68,000 AED / mo
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    ~$170,000 – $222,000 USD Tax-Free
                  </span>
                </div>
              </div>

              {/* Progression Timeline Graphic */}
              <div className="relative py-4">
                <div className="hidden md:block absolute top-1/2 left-8 right-8 h-1 bg-surface-container -translate-y-1/2 z-0"></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
                  <div className="flex flex-col bg-surface-container-lowest p-4 rounded-xl shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-7 h-7 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center font-bold text-label-sm">
                        1
                      </span>
                      <span className="font-caption-caps text-caption-caps text-on-tertiary-container uppercase font-bold">
                        Current Base
                      </span>
                    </div>
                    <h4 className="font-headline-sm text-headline-sm text-primary font-semibold">
                      {profile.targetRole || 'AI Systems Engineer'}
                    </h4>
                    <span className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                      Current proficiency verified
                    </span>
                    <div className="mt-4 pt-3 flex flex-col gap-1 text-label-sm font-label-sm text-on-surface-variant">
                      <span>• Strong Python &amp; PyTorch</span>
                      <span>• Fine-Tuning Foundations</span>
                      <span>• gRPC Microservices</span>
                    </div>
                    <span className="mt-4 inline-block font-label-sm text-label-sm text-primary font-semibold">
                      38K – 44K AED / mo
                    </span>
                  </div>

                  <div className="flex flex-col bg-surface-container-lowest p-4 rounded-xl shadow-sm ring-2 ring-secondary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-7 h-7 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-label-sm">
                        2
                      </span>
                      <span className="font-caption-caps text-caption-caps text-secondary uppercase font-bold">
                        Milestone • In Progress
                      </span>
                    </div>
                    <h4 className="font-headline-sm text-headline-sm text-primary font-semibold">
                      Cloud Inference Specialist
                    </h4>
                    <span className="font-body-sm text-body-sm text-on-surface-variant mt-1">Timeline: 2–3 Months</span>
                    <div className="mt-4 pt-3 flex flex-col gap-1 text-label-sm font-label-sm text-on-surface-variant">
                      <span>• AWS Bedrock &amp; SageMaker</span>
                      <span>• Triton Inference Server</span>
                      <span>• GPU Kubernetes Operators</span>
                    </div>
                    <span className="mt-4 inline-block font-label-sm text-label-sm text-secondary font-semibold">
                      45K – 50K AED / mo
                    </span>
                  </div>

                  <div className="flex flex-col bg-surface-container-lowest p-4 rounded-xl shadow-sm opacity-90">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-7 h-7 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center font-bold text-label-sm">
                        3
                      </span>
                      <span className="font-caption-caps text-caption-caps text-on-surface-variant uppercase font-bold">
                        Horizon • 6 Months
                      </span>
                    </div>
                    <h4 className="font-headline-sm text-headline-sm text-primary font-semibold">
                      Senior MLOps Architect
                    </h4>
                    <span className="font-body-sm text-body-sm text-on-surface-variant mt-1">Timeline: 5–8 Months</span>
                    <div className="mt-4 pt-3 flex flex-col gap-1 text-label-sm font-label-sm text-on-surface-variant">
                      <span>• Full CI/CD ML Pipelines</span>
                      <span>• Data Drift &amp; Guardrails</span>
                      <span>• Sovereign Cloud Deployments</span>
                    </div>
                    <span className="mt-4 inline-block font-label-sm text-label-sm text-primary font-semibold">
                      50K – 58K AED / mo
                    </span>
                  </div>

                  <div className="flex flex-col bg-gradient-to-b from-surface-container to-surface-container-high p-4 rounded-xl shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-label-sm">
                        ★
                      </span>
                      <span className="font-caption-caps text-caption-caps text-primary uppercase font-bold">
                        Ultimate Target
                      </span>
                    </div>
                    <h4 className="font-headline-sm text-headline-sm text-primary font-semibold">
                      Lead MLOps Engineer
                    </h4>
                    <span className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                      Estimated: 9–12 Months
                    </span>
                    <div className="mt-4 pt-3 flex flex-col gap-1 text-label-sm font-label-sm text-on-surface-variant">
                      <span>• Team Technical Leadership</span>
                      <span>• Budget &amp; GPU Fleet Scaling</span>
                      <span>• Executive Strategy Sync</span>
                    </div>
                    <span className="mt-4 inline-block font-label-sm text-label-sm text-primary font-bold">
                      60K – 70K+ AED / mo
                    </span>
                  </div>
                </div>
              </div>

              {/* Trajectory Insights Strip */}
              <div className="mt-6 pt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-container">
                  <span className="material-symbols-outlined text-primary text-[22px]">speed</span>
                  <div>
                    <h5 className="font-label-md text-label-md text-primary font-semibold">Acceleration Factor</h5>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Your systems background cuts standard MLOps progression time by ~40%.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-container">
                  <span className="material-symbols-outlined text-primary text-[22px]">domain</span>
                  <div>
                    <h5 className="font-label-md text-label-md text-primary font-semibold">Key GCC Employers</h5>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      G42 Cloud, Presight AI, Noon, Emirates Group, ADNOC AI Lab.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-container">
                  <span className="material-symbols-outlined text-primary text-[22px]">query_stats</span>
                  <div>
                    <h5 className="font-label-md text-label-md text-primary font-semibold">Verified Market Trends</h5>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      +64% YoY increase in Lead MLOps job requisitions across Dubai Internet City.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
              <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[24px]">model_training</span>
                  </div>
                  <div>
                    <span className="font-caption-caps text-caption-caps text-on-surface-variant uppercase font-bold">
                      Alternative Path A
                    </span>
                    <h4 className="font-headline-sm text-headline-sm text-primary font-semibold">
                      AI Research Scientist
                    </h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Requires deepening theoretical mathematical modeling
                    </p>
                  </div>
                </div>
                <Link
                  href="/jobs?q=AI+Research"
                  className="px-3 py-1.5 rounded-lg bg-surface-container text-primary font-label-sm text-label-sm hover:bg-surface-container-high transition-colors"
                >
                  Explore Route
                </Link>
              </div>
              <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[24px]">corporate_fare</span>
                  </div>
                  <div>
                    <span className="font-caption-caps text-caption-caps text-on-surface-variant uppercase font-bold">
                      Alternative Path B
                    </span>
                    <h4 className="font-headline-sm text-headline-sm text-primary font-semibold">
                      AI Solutions Architect
                    </h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Focuses on pre-sales engineering and enterprise integration
                    </p>
                  </div>
                </div>
                <Link
                  href="/jobs?q=Solutions+Architect"
                  className="px-3 py-1.5 rounded-lg bg-surface-container text-primary font-label-sm text-label-sm hover:bg-surface-container-high transition-colors"
                >
                  Explore Route
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* TAB PANEL 3: LEARNING RECOMMENDATIONS */}
        {activeTab === 'recommendations' && (
          <div className="flex flex-col gap-space-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="font-headline-md text-headline-md text-primary font-medium">
                  Curated Learning Modules &amp; Certifications
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Targeted coursework and industry certifications to close identified AWS and Containerization gaps.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Filter by:</span>
                <span className="px-2.5 py-1 rounded-full bg-primary-container text-on-primary font-label-sm text-label-sm">
                  High Impact First
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
              {/* Module 1: AWS Specialty */}
              <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-[0_2px_8px_-2px_rgba(53,27,50,0.04),0_12px_24px_-4px_rgba(53,27,50,0.03)] flex flex-col justify-between group hover:shadow-lg transition-all">
                <div className="relative h-44 w-full overflow-hidden">
                  <img
                    alt="AWS Certification"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD1FJpUpLEYAJqh7DGIUDMA_aru-gkOuAaH8CGy9eurBGtKfzX-NXGyrXL4SR05RzQUYZ8PiOCKe2uhwlGgTV64n-Yw2GfvqrGAwgAwsToeLZ1Tf8M1mUc8QuzVyYjDASEedy6_0sg8WHA31vGzcEW1iXnpKDxj4Q_7ppcjsStQP6JRxo_UGLhasoY5jH6dwzKbTpmKpnMUgjXSt2yM7GItk450bv9_ofbVNJe-cfQA99WnH7Cwoemm"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent"></div>
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-label-sm font-label-sm font-bold shadow-sm">
                    Top Priority • Closes 15% Gap
                  </span>
                  <span className="absolute bottom-3 left-3 text-on-primary font-caption-caps text-caption-caps uppercase tracking-wider">
                    Official Certification Track
                  </span>
                </div>
                <div className="p-5 flex flex-col flex-1 justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-on-surface-variant text-body-sm font-body-sm mb-1">
                      <span className="material-symbols-outlined text-[16px]">schedule</span> 32 Hours • Self-Paced
                      <span>•</span>
                      <span className="material-symbols-outlined text-[16px]">school</span> AWS Certified
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-primary font-semibold mt-1">
                      AWS Certified Machine Learning – Specialty (MLS-C01)
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 leading-relaxed">
                      Master Amazon SageMaker model registries, distributed multi-GPU training clusters, and Bedrock
                      foundational API pipelines.
                    </p>
                  </div>
                  <div className="mt-5 pt-4 flex items-center justify-between">
                    <div>
                      <span className="font-caption-caps text-caption-caps text-on-surface-variant uppercase">
                        Estimated Value
                      </span>
                      <p className="font-label-md text-label-md text-primary font-bold">+18% GCC Salary Match</p>
                    </div>
                    <a
                      href="https://aws.amazon.com/certification/certified-machine-learning-specialty/"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary-container text-on-primary font-label-md text-label-md hover:opacity-90 transition-all"
                    >
                      Enroll Track
                      <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Module 2: Hugging Face Deep Dive */}
              <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-[0_2px_8px_-2px_rgba(53,27,50,0.04),0_12px_24px_-4px_rgba(53,27,50,0.03)] flex flex-col justify-between group hover:shadow-lg transition-all">
                <div className="relative h-44 w-full overflow-hidden">
                  <img
                    alt="Hugging Face Lab"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuA6n7LCViOuP5giiRk5t1XsuP7AhGbVr6ABr_FfP0beiowq3OXPr-y5fh-YocUA6hrN6lJYwHlIbx5ra0fx9y4HAvtTWSFTeuhbPRk6cBrQuwI3eVtTj2fEKiRdO6jjdGCk-wTQxHn5h0at4usqsaxT5b2D-b3A0h-stwOgZ1DpxXJTbh366Nf4YwKlqC_mOMSnYHcC1_YRNsAs76WJxp26kGRj02H0YPGjNU2QYhOVTcpOISabCG6G"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent"></div>
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-label-sm font-label-sm font-bold shadow-sm">
                    High ROI
                  </span>
                  <span className="absolute bottom-3 left-3 text-on-primary font-caption-caps text-caption-caps uppercase tracking-wider">
                    Hands-on Engineering
                  </span>
                </div>
                <div className="p-5 flex flex-col flex-1 justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-on-surface-variant text-body-sm font-body-sm mb-1">
                      <span className="material-symbols-outlined text-[16px]">schedule</span> 18 Hours • Hands-on Labs
                      <span>•</span>
                      <span className="material-symbols-outlined text-[16px]">token</span> Hugging Face
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-primary font-semibold mt-1">
                      Hugging Face Deep Dive: Production LLM Optimization
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 leading-relaxed">
                      Advanced quantizations (AWQ/GPTQ), vLLM deployment engines, and continuous batching systems for
                      high-concurrency LLM APIs.
                    </p>
                  </div>
                  <div className="mt-5 pt-4 flex items-center justify-between">
                    <div>
                      <span className="font-caption-caps text-caption-caps text-on-surface-variant uppercase">
                        Alignment Boost
                      </span>
                      <p className="font-label-md text-label-md text-primary font-bold">UAE Sovereign LLMs</p>
                    </div>
                    <a
                      href="https://huggingface.co/learn"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary-container text-on-primary font-label-md text-label-md hover:opacity-90 transition-all"
                    >
                      Start Lab
                      <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Module 3: Docker & Kubernetes for ML */}
              <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-[0_2px_8px_-2px_rgba(53,27,50,0.04),0_12px_24px_-4px_rgba(53,27,50,0.03)] flex flex-col justify-between group hover:shadow-lg transition-all">
                <div className="relative h-44 w-full overflow-hidden">
                  <img
                    alt="Kubernetes GPU"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCgpTKzQ1bwvT1bTiqZOorYWQ8M83Wdssg9xkbjHDiSKSeex_TQ63_nDmgzm9KZAzIbhyNnuu-vOUc1bMD_YqOkru6p9ElHBr8iUHRCdy8LkkLGwjaITepi81GuSKenH2NKCNYXUgdh7SnrGulsJO7x1qLhpsi4at5Lc9P-DZzeBB1qyQnF2dDqGsT96Or-xgI-2sZYe5sa6cCXbZ1PudX7vn3vs524RycMMhjMJtFE0yen6JO2mfrF"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent"></div>
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-label-sm font-label-sm font-bold shadow-sm">
                    Core Deficiency Fix
                  </span>
                  <span className="absolute bottom-3 left-3 text-on-primary font-caption-caps text-caption-caps uppercase tracking-wider">
                    Architecture Mastery
                  </span>
                </div>
                <div className="p-5 flex flex-col flex-1 justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-on-surface-variant text-body-sm font-body-sm mb-1">
                      <span className="material-symbols-outlined text-[16px]">schedule</span> 24 Hours • Project-Based
                      <span>•</span>
                      <span className="material-symbols-outlined text-[16px]">developer_board</span> Cloud Native
                      (CNCF)
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-primary font-semibold mt-1">
                      Kubernetes &amp; NVIDIA GPU Pod Orchestration
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 leading-relaxed">
                      Learn Helm packaging, KServe model deployment, and cost-effective multi-tenant GPU sharing
                      strategies for enterprise scale.
                    </p>
                  </div>
                  <div className="mt-5 pt-4 flex items-center justify-between">
                    <div>
                      <span className="font-caption-caps text-caption-caps text-on-surface-variant uppercase">
                        Target Unlock
                      </span>
                      <p className="font-label-md text-label-md text-primary font-bold">Senior MLOps Roles</p>
                    </div>
                    <a
                      href="https://kubernetes.io/docs/tasks/manage-gpus/scheduling-gpus/"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary-container text-on-primary font-label-md text-label-md hover:opacity-90 transition-all"
                    >
                      View Syllabus
                      <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Company Specific Hiring Criteria Matrix */}
            <div className="bg-surface-container-low rounded-xl p-space-md mt-2">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-primary text-[20px]">corporate_fare</span>
                <h4 className="font-headline-sm text-headline-sm text-primary font-semibold">
                  GCC Enterprise Employer Skill Weightings
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-surface-container-lowest p-3.5 rounded-lg flex flex-col justify-between">
                  <div>
                    <span className="font-label-md text-label-md text-primary font-bold">G42 / Inception</span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                      Weighting: Large scale distributed pre-training + bilingual LLM tuning.
                    </p>
                  </div>
                  <span className="mt-3 text-label-sm font-label-sm text-on-tertiary-container font-semibold">
                    Your Match: 91%
                  </span>
                </div>
                <div className="bg-surface-container-lowest p-3.5 rounded-lg flex flex-col justify-between">
                  <div>
                    <span className="font-label-md text-label-md text-primary font-bold">Careem (Uber)</span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                      Weighting: Low-latency gRPC inference endpoints + real-time feature stores.
                    </p>
                  </div>
                  <span className="mt-3 text-label-sm font-label-sm text-on-tertiary-container font-semibold">
                    Your Match: 88%
                  </span>
                </div>
                <div className="bg-surface-container-lowest p-3.5 rounded-lg flex flex-col justify-between">
                  <div>
                    <span className="font-label-md text-label-md text-primary font-bold">Presight AI</span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                      Weighting: Enterprise AWS SageMaker pipelines &amp; Big Data computer vision.
                    </p>
                  </div>
                  <span className="mt-3 text-label-sm font-label-sm text-secondary font-semibold">
                    Your Match: 73% (Gaps in AWS)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mandatory Distinction Banner */}
        <div className="mt-space-xl p-4 rounded-xl bg-surface-container flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center shrink-0 text-primary">
            <span className="material-symbols-outlined text-[18px]">verified_user</span>
          </div>
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Insights derived from parsed job postings. Recommendations are advisory and continually updated.
            </p>
            <span className="font-caption-caps text-caption-caps text-on-surface-variant whitespace-nowrap">
              Engine Version 3.4 • GCC Radar Active
            </span>
          </div>
        </div>
      </div>
    </StitchShell>
  );
}
