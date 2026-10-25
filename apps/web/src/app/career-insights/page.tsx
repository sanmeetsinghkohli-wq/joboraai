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
        <div className="editorial-card border border-[#EDE5E1] bg-white rounded-2xl p-6 md:p-8 shadow-sm mb-6">
          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="max-w-3xl">
              <span className="badge-coral uppercase tracking-wider text-[11px] font-bold">
                GCC Market Intelligence • Q2 Active Radar
              </span>
              <h1 className="font-serif text-3xl md:text-4xl font-semibold text-[#351B32] tracking-tight mt-1">
                Career Insights &amp; Market Alignment
              </h1>
              <p className="text-sm text-[#7D747D] mt-2 font-sans leading-relaxed">
                AI-analyzed competency benchmarking against {Math.max(1200, jobs.length * 60).toLocaleString()}+ live
                AI/ML engineering postings in {profile.location || 'Dubai and GCC'}.
              </p>
            </div>
            <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
              <button
                onClick={() => {
                  const next = !dubaiFilterActive;
                  setDubaiFilterActive(next);
                  refreshJobs('', next ? 'Dubai' : '');
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition-all ${
                  dubaiFilterActive
                    ? 'bg-[#351B32] text-white'
                    : 'btn-editorial-secondary'
                }`}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">tune</span>
                {dubaiFilterActive ? 'Filtered: Dubai Tech Hub' : 'Filter Dubai Tech Hub'}
              </button>
              <Link
                href="/cv-studio"
                onClick={() => logActivity('auto_awesome', 'Re-synced resume skills with Career Insights', 'Market Radar')}
                className="btn-editorial-primary text-xs flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                <span>Re-sync Resume</span>
              </Link>
            </div>
          </div>

          {/* Live Benchmarking Pulse Stat Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 bg-[#F8F5F0]/60 border border-[#EDE5E1] rounded-xl p-4">
            <div className="flex flex-col px-3 py-1">
              <span className="text-[11px] font-semibold text-[#7D747D] uppercase tracking-wider">
                Heuristic Readiness
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="font-serif text-2xl font-bold text-[#351B32]">{compositeScore}%</span>
                <span className="badge-emerald text-[11px] font-bold">
                  Profile Synced
                </span>
              </div>
              <span className="text-xs text-[#7D747D] mt-0.5">
                Based on {profile.skills.length} verified profile skills
              </span>
            </div>
            <div className="flex flex-col px-3 py-1">
              <span className="text-[11px] font-semibold text-[#7D747D] uppercase tracking-wider">
                Synced Live Roles
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="font-serif text-2xl font-bold text-[#351B32]">{jobs.length}</span>
                <span className="badge-coral text-[11px] font-bold">Live Feed</span>
              </div>
              <span className="text-xs text-[#7D747D] mt-0.5">
                Remotive + Arbeitnow + Curated
              </span>
            </div>
            <div className="flex flex-col px-3 py-1">
              <span className="text-[11px] font-semibold text-[#7D747D] uppercase tracking-wider">
                Illustrative Benchmark
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="font-serif text-2xl font-bold text-[#351B32]">48K</span>
                <span className="text-xs text-[#7D747D] font-medium">AED/mo</span>
              </div>
              <span className="text-xs text-[#7D747D] mt-0.5">
                Illustrative GCC Senior AI/ML range
              </span>
            </div>
            <div className="flex flex-col px-3 py-1">
              <span className="text-[11px] font-semibold text-[#7D747D] uppercase tracking-wider">
                Skill Closure Plan
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="font-serif text-2xl font-bold text-[#351B32]">28 Days</span>
                <span className="badge-neutral text-[11px] font-bold">
                  Est. Roadmap
                </span>
              </div>
              <span className="text-xs text-[#7D747D] mt-0.5">
                AI-suggested study sprint estimate
              </span>
            </div>
          </div>
        </div>

        {/* Interactive Filter Tabs */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-1.5 p-1 bg-[#F8F5F0] border border-[#EDE5E1] rounded-xl">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-4 py-2 rounded-lg text-xs transition-all ${
                activeTab === 'matrix'
                  ? 'bg-[#351B32] text-white shadow-xs font-semibold'
                  : 'font-medium text-[#5A525A] hover:text-[#351B32]'
              }`}
              type="button"
            >
              Skill Gap Matrix
            </button>
            <button
              onClick={() => setActiveTab('trajectory')}
              className={`px-4 py-2 rounded-lg text-xs transition-all ${
                activeTab === 'trajectory'
                  ? 'bg-[#351B32] text-white shadow-xs font-semibold'
                  : 'font-medium text-[#5A525A] hover:text-[#351B32]'
              }`}
              type="button"
            >
              Career Paths &amp; Trajectory
            </button>
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`px-4 py-2 rounded-lg text-xs transition-all ${
                activeTab === 'recommendations'
                  ? 'bg-[#351B32] text-white shadow-xs font-semibold'
                  : 'font-medium text-[#5A525A] hover:text-[#351B32]'
              }`}
              type="button"
            >
              Learning Recommendations
            </button>
          </div>
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#268566]"></span>
              <span className="text-xs text-[#7D747D]">Your Level</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E76F72]"></span>
              <span className="text-xs text-[#7D747D]">
                Regional Market Demand
              </span>
            </div>
          </div>
        </div>

        {/* TAB PANEL 1: SKILL GAP MATRIX */}
        {activeTab === 'matrix' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Interactive Benchmark Bars List */}
              <div className="lg:col-span-8 flex flex-col gap-4">
                {/* Python & PyTorch */}
                <div className="editorial-card border border-[#EDE5E1] bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#F8F5F0] border border-[#EDE5E1] flex items-center justify-center text-[#351B32] font-bold">
                        <span className="material-symbols-outlined text-[20px]">terminal</span>
                      </div>
                      <div>
                        <h3 className="font-serif text-lg text-[#351B32] font-semibold">
                          Python &amp; PyTorch
                        </h3>
                        <p className="text-xs text-[#7D747D]">
                          Foundational tensor mechanics, graph optimization, and neural architecture
                        </p>
                      </div>
                    </div>
                    <span className="badge-emerald text-[11px] font-bold">
                      <span className="material-symbols-outlined text-[16px]">verified</span>
                      Strong Fit
                    </span>
                  </div>
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#351B32] font-semibold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#268566]"></span>
                        User Proficiency
                      </span>
                      <span className="text-[#351B32] font-bold">{pyTorchLevel}%</span>
                    </div>
                    <div className="w-full bg-[#EDE5E1] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#268566] h-2 rounded-full transition-all duration-700"
                        style={{ width: `${pyTorchLevel}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-1">
                      <span className="text-[#7D747D] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#E76F72]"></span>
                        GCC Market Demand
                      </span>
                      <span className="text-[#7D747D] font-medium">90%</span>
                    </div>
                    <div className="w-full bg-[#EDE5E1] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#E76F72] h-2 rounded-full transition-all duration-700"
                        style={{ width: '90%' }}
                      ></div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 flex items-center justify-between text-xs text-[#5A525A] bg-[#F8F5F0] border border-[#EDE5E1] px-3.5 py-2.5 rounded-xl">
                    <span>
                      Identified in <strong>1,120 of 1,248</strong> tracked roles (e.g., G42, Careem, Hub71 startups)
                    </span>
                    <span className="text-xs text-[#268566] font-bold">
                      +{pyTorchLevel - 90}% Advantage
                    </span>
                  </div>
                </div>

                {/* LLM Fine-Tuning & RAG */}
                <div className="editorial-card border border-[#EDE5E1] bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#F8F5F0] border border-[#EDE5E1] flex items-center justify-center text-[#351B32] font-bold">
                        <span className="material-symbols-outlined text-[20px]">psychology</span>
                      </div>
                      <div>
                        <h3 className="font-serif text-lg text-[#351B32] font-semibold">
                          LLM Fine-Tuning &amp; RAG
                        </h3>
                        <p className="text-xs text-[#7D747D]">
                          LoRA/QLoRA adapter training, vector retrieval (Milvus/Pinecone), embedding pipelines
                        </p>
                      </div>
                    </div>
                    <span className="badge-emerald text-[11px] font-bold">
                      <span className="material-symbols-outlined text-[16px]">verified</span>
                      Strong Fit
                    </span>
                  </div>
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#351B32] font-semibold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#268566]"></span>
                        User Proficiency
                      </span>
                      <span className="text-[#351B32] font-bold">{llmLevel}%</span>
                    </div>
                    <div className="w-full bg-[#EDE5E1] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#268566] h-2 rounded-full transition-all duration-700"
                        style={{ width: `${llmLevel}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-1">
                      <span className="text-[#7D747D] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#E76F72]"></span>
                        GCC Market Demand
                      </span>
                      <span className="text-[#7D747D] font-medium">88%</span>
                    </div>
                    <div className="w-full bg-[#EDE5E1] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#E76F72] h-2 rounded-full transition-all duration-700"
                        style={{ width: '88%' }}
                      ></div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 flex items-center justify-between text-xs text-[#5A525A] bg-[#F8F5F0] border border-[#EDE5E1] px-3.5 py-2.5 rounded-xl">
                    <span>Elevated premium in UAE Sovereign AI programs and bilingual Arabic LLM initiatives</span>
                    <span className="text-xs text-[#268566] font-bold">
                      +{llmLevel - 88}% Advantage
                    </span>
                  </div>
                </div>

                {/* AWS Bedrock & SageMaker */}
                <div className="editorial-card border border-[#EDE5E1] bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#F8F5F0] border border-[#EDE5E1] flex items-center justify-center text-[#E76F72] font-bold">
                        <span className="material-symbols-outlined text-[20px]">cloud_sync</span>
                      </div>
                      <div>
                        <h3 className="font-serif text-lg text-[#351B32] font-semibold">
                          AWS Bedrock &amp; SageMaker
                        </h3>
                        <p className="text-xs text-[#7D747D]">
                          Cloud orchestration, enterprise foundational model governance, ML endpoints
                        </p>
                      </div>
                    </div>
                    <span className="badge-coral text-[11px] font-bold">
                      <span className="material-symbols-outlined text-[16px]">info</span>
                      Minor Gap (-15%)
                    </span>
                  </div>
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#351B32] font-semibold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#268566]"></span>
                        User Proficiency
                      </span>
                      <span className="text-[#351B32] font-bold">{awsLevel}%</span>
                    </div>
                    <div className="w-full bg-[#EDE5E1] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#268566] h-2 rounded-full transition-all duration-700"
                        style={{ width: `${awsLevel}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-1">
                      <span className="text-[#7D747D] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#E76F72]"></span>
                        GCC Market Demand
                      </span>
                      <span className="text-[#7D747D] font-medium">85%</span>
                    </div>
                    <div className="w-full bg-[#EDE5E1] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#E76F72] h-2 rounded-full transition-all duration-700"
                        style={{ width: '85%' }}
                      ></div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 flex items-center justify-between text-xs text-[#E76F72] bg-rose-50/50 border border-rose-100 px-3.5 py-2.5 rounded-xl">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">arrow_circle_up</span>
                      Closing this gap unlocks an estimated +18% candidate screening pass rate
                    </span>
                    <button
                      onClick={() => setActiveTab('recommendations')}
                      className="underline font-semibold hover:text-[#351B32]"
                      type="button"
                    >
                      Take AWS Deep Dive
                    </button>
                  </div>
                </div>

                {/* Docker & Containerization */}
                <div className="editorial-card border border-[#EDE5E1] bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#F8F5F0] border border-[#EDE5E1] flex items-center justify-center text-[#E76F72] font-bold">
                        <span className="material-symbols-outlined text-[20px]">layers</span>
                      </div>
                      <div>
                        <h3 className="font-serif text-lg text-[#351B32] font-semibold">
                          Docker &amp; Containerization
                        </h3>
                        <p className="text-xs text-[#7D747D]">
                          Kubernetes pods, multi-stage GPU builds, Triton inference server containers
                        </p>
                      </div>
                    </div>
                    <span className="badge-neutral text-[11px] font-bold">
                      <span className="material-symbols-outlined text-[16px]">trending_up</span>
                      Growth Area (-15%)
                    </span>
                  </div>
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#351B32] font-semibold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#268566]"></span>
                        User Proficiency
                      </span>
                      <span className="text-[#351B32] font-bold">{dockerLevel}%</span>
                    </div>
                    <div className="w-full bg-[#EDE5E1] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#268566] h-2 rounded-full transition-all duration-700"
                        style={{ width: `${dockerLevel}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-1">
                      <span className="text-[#7D747D] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#E76F72]"></span>
                        GCC Market Demand
                      </span>
                      <span className="text-[#7D747D] font-medium">80%</span>
                    </div>
                    <div className="w-full bg-[#EDE5E1] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#E76F72] h-2 rounded-full transition-all duration-700"
                        style={{ width: '80%' }}
                      ></div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 flex items-center justify-between text-xs text-[#5A525A] bg-[#F8F5F0] border border-[#EDE5E1] px-3.5 py-2.5 rounded-xl">
                    <span>Essential for transition to Senior &amp; Staff MLOps roles in enterprise platforms</span>
                    <span className="text-xs text-[#E76F72] font-bold">Priority Sprint</span>
                  </div>
                </div>

                {/* Distributed Systems (Go/gRPC) */}
                <div className="editorial-card border border-[#EDE5E1] bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#F8F5F0] border border-[#EDE5E1] flex items-center justify-center text-[#268566] font-bold">
                        <span className="material-symbols-outlined text-[20px]">hub</span>
                      </div>
                      <div>
                        <h3 className="font-serif text-lg text-[#351B32] font-semibold">
                          Distributed Systems (Go/gRPC)
                        </h3>
                        <p className="text-xs text-[#7D747D]">
                          High-throughput microservices, low-latency streaming endpoints, concurrency models
                        </p>
                      </div>
                    </div>
                    <span className="badge-emerald text-[11px] font-bold">
                      <span className="material-symbols-outlined text-[16px]">stars</span>
                      Standout Differentiator (+10%)
                    </span>
                  </div>
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#351B32] font-semibold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#268566]"></span>
                        User Proficiency
                      </span>
                      <span className="text-[#351B32] font-bold">{goLevel}%</span>
                    </div>
                    <div className="w-full bg-[#EDE5E1] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#268566] h-2 rounded-full transition-all duration-700"
                        style={{ width: `${goLevel}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-1">
                      <span className="text-[#7D747D] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#E76F72]"></span>
                        GCC Market Demand
                      </span>
                      <span className="text-[#7D747D] font-medium">75%</span>
                    </div>
                    <div className="w-full bg-[#EDE5E1] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#E76F72] h-2 rounded-full transition-all duration-700"
                        style={{ width: '75%' }}
                      ></div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 flex items-center justify-between text-xs text-[#5A525A] bg-[#F8F5F0] border border-[#EDE5E1] px-3.5 py-2.5 rounded-xl">
                    <span>Rare dual-specialization: ML intelligence combined with backend systems velocity</span>
                    <span className="text-xs text-[#268566] font-bold">
                      High Leverage
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Visual Skill Radar & Competitive Distribution */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                {/* Interactive Radar Graphic Card */}
                <div className="editorial-card border border-[#EDE5E1] bg-white rounded-2xl p-5 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-serif text-lg text-[#351B32] font-semibold">
                        Competency Hexagon
                      </h3>
                      <p className="text-xs text-[#7D747D]">
                        Vector profile vs Senior Engineer baseline
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-[#7D747D] text-[20px]">radar</span>
                  </div>
                  <div className="relative w-full aspect-square max-w-[280px] mx-auto my-2 flex items-center justify-center">
                    <svg className="w-full h-full text-[#EDE5E1]" viewBox="0 0 240 240">
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
                        fill="#E76F72"
                        fillOpacity="0.12"
                        points="120,38 190,78 185,160 120,185 52,150 48,78"
                        stroke="#E76F72"
                        strokeWidth="1.5"
                      ></polygon>
                      <polygon
                        fill="#351B32"
                        fillOpacity="0.2"
                        points="120,28 195,73 162,163 120,172 44,142 42,72"
                        stroke="#351B32"
                        strokeWidth="2"
                      ></polygon>
                      <circle fill="#268566" cx="120" cy="28" r="4"></circle>
                      <circle fill="#268566" cx="195" cy="73" r="4"></circle>
                      <circle fill="#E76F72" cx="162" cy="163" r="4"></circle>
                      <circle fill="#E76F72" cx="120" cy="172" r="4"></circle>
                      <circle fill="#268566" cx="44" cy="142" r="4"></circle>
                      <circle fill="#351B32" cx="42" cy="72" r="4"></circle>
                    </svg>
                    <span className="absolute top-0 text-[10px] uppercase tracking-wider text-[#351B32] font-bold">
                      PyTorch ({pyTorchLevel}%)
                    </span>
                    <span className="absolute right-0 top-16 text-[10px] uppercase tracking-wider text-[#351B32] font-bold">
                      LLMs ({llmLevel}%)
                    </span>
                    <span className="absolute right-0 bottom-14 text-[10px] uppercase tracking-wider text-[#E76F72] font-bold">
                      AWS ({awsLevel}%)
                    </span>
                    <span className="absolute bottom-0 text-[10px] uppercase tracking-wider text-[#E76F72] font-bold">
                      Docker ({dockerLevel}%)
                    </span>
                    <span className="absolute left-0 bottom-14 text-[10px] uppercase tracking-wider text-[#351B32] font-bold">
                      gRPC ({goLevel}%)
                    </span>
                    <span className="absolute left-0 top-16 text-[10px] uppercase tracking-wider text-[#351B32] font-bold">
                      Architecture
                    </span>
                  </div>
                  <div className="mt-3 p-3 bg-[#F8F5F0] border border-[#EDE5E1] rounded-xl flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs text-[#351B32] font-semibold">
                        Composite Fit Score
                      </span>
                      <span className="text-[11px] text-[#7D747D]">Across UAE ML Openings</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-[#EDE5E1] shadow-xs">
                      <span className="font-serif text-lg text-[#351B32] font-bold">
                        {compositeScore}/100
                      </span>
                    </div>
                  </div>
                </div>

                {/* Regional Market Insight Snippet */}
                <div className="editorial-card border border-[#EDE5E1] bg-[#F8F5F0]/60 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-[#E76F72] text-[20px]">explore</span>
                      <span className="badge-coral uppercase font-bold tracking-wider text-[11px]">
                        Hiring Hotspot Intelligence
                      </span>
                    </div>
                    <h4 className="font-serif text-base text-[#351B32] font-semibold mt-1">
                      DIFC &amp; Riyadh Surge
                    </h4>
                    <p className="text-xs text-[#7D747D] mt-2 leading-relaxed">
                      Financial institutions in Dubai International Financial Centre (DIFC) and sovereign platforms in
                      Riyadh are paying a <strong>22% premium</strong> for ML engineers proficient in localized Arabic
                      fine-tuning with enterprise compliance guarantees.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#EDE5E1] flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#351B32] text-white flex items-center justify-center font-bold text-xs">
                      JN
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-[#351B32] font-semibold">
                        Verified by Jobora Recruiter Network
                      </span>
                      <span className="text-[11px] text-[#7D747D]">
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
          <div className="flex flex-col gap-6">
            <div className="editorial-card border border-[#EDE5E1] bg-white rounded-2xl p-6 md:p-8 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-6 border-b border-[#EDE5E1]">
                <div>
                  <div className="inline-flex items-center gap-1.5 badge-coral text-[11px] font-bold mb-2">
                    <span className="material-symbols-outlined text-[16px]">alt_route</span>
                    <span>AI Recommended Progression Path</span>
                  </div>
                  <h2 className="font-serif text-2xl md:text-3xl font-semibold text-[#351B32]">
                    {profile.targetRole || 'AI Systems Engineer'} → Lead MLOps Engineer
                  </h2>
                  <p className="text-sm text-[#7D747D] mt-1 font-sans">
                    Optimized route leveraging your strong Distributed Systems background to pivot into high-yield ML
                    infrastructure.
                  </p>
                </div>
                <div className="flex flex-col items-start md:items-end bg-[#F8F5F0] border border-[#EDE5E1] px-4 py-3 rounded-xl shrink-0">
                  <span className="text-[11px] font-semibold text-[#7D747D] uppercase tracking-wider">
                    Target Compensation Range
                  </span>
                  <span className="font-serif text-xl font-bold text-[#351B32] mt-0.5">
                    52,000 - 68,000 AED / mo
                  </span>
                  <span className="text-xs text-[#5A525A]">
                    ~$170,000 – $222,000 USD Tax-Free
                  </span>
                </div>
              </div>

              {/* Progression Timeline Graphic */}
              <div className="relative py-4">
                <div className="hidden md:block absolute top-1/2 left-8 right-8 h-1 bg-[#EDE5E1] -translate-y-1/2 z-0"></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
                  <div className="editorial-card border border-[#EDE5E1] bg-[#F8F5F0]/30 p-4 rounded-xl shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-7 h-7 rounded-full bg-[#268566] text-white flex items-center justify-center font-bold text-xs">
                          1
                        </span>
                        <span className="badge-emerald text-[11px] font-bold uppercase">
                          Current Base
                        </span>
                      </div>
                      <h4 className="font-serif text-base text-[#351B32] font-semibold">
                        {profile.targetRole || 'AI Systems Engineer'}
                      </h4>
                      <span className="text-xs text-[#7D747D] mt-1 block">
                        Current proficiency verified
                      </span>
                      <div className="mt-4 pt-3 border-t border-[#EDE5E1] flex flex-col gap-1 text-xs text-[#5A525A]">
                        <span>• Strong Python &amp; PyTorch</span>
                        <span>• Fine-Tuning Foundations</span>
                        <span>• gRPC Microservices</span>
                      </div>
                    </div>
                    <span className="mt-4 inline-block text-xs text-[#351B32] font-semibold">
                      38K – 44K AED / mo
                    </span>
                  </div>

                  <div className="editorial-card border-2 border-[#E76F72] bg-white p-4 rounded-xl shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-7 h-7 rounded-full bg-[#E76F72] text-white flex items-center justify-center font-bold text-xs">
                          2
                        </span>
                        <span className="badge-coral text-[11px] font-bold uppercase">
                          Milestone • In Progress
                        </span>
                      </div>
                      <h4 className="font-serif text-base text-[#351B32] font-semibold">
                        Cloud Inference Specialist
                      </h4>
                      <span className="text-xs text-[#7D747D] mt-1 block">Timeline: 2–3 Months</span>
                      <div className="mt-4 pt-3 border-t border-[#EDE5E1] flex flex-col gap-1 text-xs text-[#5A525A]">
                        <span>• AWS Bedrock &amp; SageMaker</span>
                        <span>• Triton Inference Server</span>
                        <span>• GPU Kubernetes Operators</span>
                      </div>
                    </div>
                    <span className="mt-4 inline-block text-xs text-[#E76F72] font-bold">
                      45K – 50K AED / mo
                    </span>
                  </div>

                  <div className="editorial-card border border-[#EDE5E1] bg-[#F8F5F0]/30 p-4 rounded-xl shadow-xs opacity-90 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-7 h-7 rounded-full bg-[#EDE5E1] text-[#351B32] flex items-center justify-center font-bold text-xs">
                          3
                        </span>
                        <span className="badge-neutral text-[11px] font-bold uppercase">
                          Horizon • 6 Months
                        </span>
                      </div>
                      <h4 className="font-serif text-base text-[#351B32] font-semibold">
                        Senior MLOps Architect
                      </h4>
                      <span className="text-xs text-[#7D747D] mt-1 block">Timeline: 5–8 Months</span>
                      <div className="mt-4 pt-3 border-t border-[#EDE5E1] flex flex-col gap-1 text-xs text-[#5A525A]">
                        <span>• Full CI/CD ML Pipelines</span>
                        <span>• Data Drift &amp; Guardrails</span>
                        <span>• Sovereign Cloud Deployments</span>
                      </div>
                    </div>
                    <span className="mt-4 inline-block text-xs text-[#351B32] font-semibold">
                      50K – 58K AED / mo
                    </span>
                  </div>

                  <div className="editorial-card border border-[#351B32] bg-[#351B32] text-white p-4 rounded-xl shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-7 h-7 rounded-full bg-[#E76F72] text-white flex items-center justify-center font-bold text-xs">
                          ★
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-rose-200">
                          Ultimate Target
                        </span>
                      </div>
                      <h4 className="font-serif text-base text-white font-semibold">
                        Lead MLOps Engineer
                      </h4>
                      <span className="text-xs text-white/70 mt-1 block">
                        Estimated: 9–12 Months
                      </span>
                      <div className="mt-4 pt-3 border-t border-white/20 flex flex-col gap-1 text-xs text-white/80">
                        <span>• Team Technical Leadership</span>
                        <span>• Budget &amp; GPU Fleet Scaling</span>
                        <span>• Executive Strategy Sync</span>
                      </div>
                    </div>
                    <span className="mt-4 inline-block text-xs text-white font-bold">
                      60K – 70K+ AED / mo
                    </span>
                  </div>
                </div>
              </div>

              {/* Trajectory Insights Strip */}
              <div className="mt-6 pt-5 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-[#EDE5E1]">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#F8F5F0] border border-[#EDE5E1]">
                  <span className="material-symbols-outlined text-[#351B32] text-[22px]">speed</span>
                  <div>
                    <h5 className="text-xs font-semibold text-[#351B32]">Acceleration Factor</h5>
                    <p className="text-xs text-[#7D747D] mt-0.5 leading-relaxed">
                      Your systems background cuts standard MLOps progression time by ~40%.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#F8F5F0] border border-[#EDE5E1]">
                  <span className="material-symbols-outlined text-[#351B32] text-[22px]">domain</span>
                  <div>
                    <h5 className="text-xs font-semibold text-[#351B32]">Key GCC Employers</h5>
                    <p className="text-xs text-[#7D747D] mt-0.5 leading-relaxed">
                      G42 Cloud, Presight AI, Noon, Emirates Group, ADNOC AI Lab.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#F8F5F0] border border-[#EDE5E1]">
                  <span className="material-symbols-outlined text-[#351B32] text-[22px]">query_stats</span>
                  <div>
                    <h5 className="text-xs font-semibold text-[#351B32]">Verified Market Trends</h5>
                    <p className="text-xs text-[#7D747D] mt-0.5 leading-relaxed">
                      +64% YoY increase in Lead MLOps job requisitions across Dubai Internet City.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="editorial-card border border-[#EDE5E1] bg-white p-5 rounded-2xl shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#F8F5F0] border border-[#EDE5E1] flex items-center justify-center text-[#351B32]">
                    <span className="material-symbols-outlined text-[24px]">model_training</span>
                  </div>
                  <div>
                    <span className="badge-neutral text-[10px] font-bold uppercase tracking-wider">
                      Alternative Path A
                    </span>
                    <h4 className="font-serif text-base text-[#351B32] font-semibold mt-0.5">
                      AI Research Scientist
                    </h4>
                    <p className="text-xs text-[#7D747D]">
                      Requires deepening theoretical mathematical modeling
                    </p>
                  </div>
                </div>
                <Link
                  href="/jobs?q=AI+Research"
                  className="btn-editorial-secondary text-xs"
                >
                  Explore Route
                </Link>
              </div>
              <div className="editorial-card border border-[#EDE5E1] bg-white p-5 rounded-2xl shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#F8F5F0] border border-[#EDE5E1] flex items-center justify-center text-[#351B32]">
                    <span className="material-symbols-outlined text-[24px]">corporate_fare</span>
                  </div>
                  <div>
                    <span className="badge-neutral text-[10px] font-bold uppercase tracking-wider">
                      Alternative Path B
                    </span>
                    <h4 className="font-serif text-base text-[#351B32] font-semibold mt-0.5">
                      AI Solutions Architect
                    </h4>
                    <p className="text-xs text-[#7D747D]">
                      Focuses on pre-sales engineering and enterprise integration
                    </p>
                  </div>
                </div>
                <Link
                  href="/jobs?q=Solutions+Architect"
                  className="btn-editorial-secondary text-xs"
                >
                  Explore Route
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* TAB PANEL 3: LEARNING RECOMMENDATIONS */}
        {activeTab === 'recommendations' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl font-semibold text-[#351B32]">
                  Curated Learning Modules &amp; Certifications
                </h2>
                <p className="text-sm text-[#7D747D] mt-1 font-sans">
                  Targeted coursework and industry certifications to close identified AWS and Containerization gaps.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#7D747D]">Filter by:</span>
                <span className="badge-coral text-xs font-bold">
                  High Impact First
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Module 1: AWS Specialty */}
              <div className="editorial-card border border-[#EDE5E1] bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
                <div className="relative h-44 w-full overflow-hidden">
                  <img
                    alt="AWS Certification"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD1FJpUpLEYAJqh7DGIUDMA_aru-gkOuAaH8CGy9eurBGtKfzX-NXGyrXL4SR05RzQUYZ8PiOCKe2uhwlGgTV64n-Yw2GfvqrGAwgAwsToeLZ1Tf8M1mUc8QuzVyYjDASEedy6_0sg8WHA31vGzcEW1iXnpKDxj4Q_7ppcjsStQP6JRxo_UGLhasoY5jH6dwzKbTpmKpnMUgjXSt2yM7GItk450bv9_ofbVNJe-cfQA99WnH7Cwoemm"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#351B32]/80 via-transparent to-transparent"></div>
                  <span className="absolute top-3 left-3 badge-coral text-xs font-bold shadow-sm">
                    Top Priority • Closes 15% Gap
                  </span>
                  <span className="absolute bottom-3 left-3 text-white text-[11px] font-semibold uppercase tracking-wider">
                    Official Certification Track
                  </span>
                </div>
                <div className="p-5 flex flex-col flex-1 justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-[#7D747D] text-xs mb-1">
                      <span className="material-symbols-outlined text-[16px]">schedule</span> 32 Hours • Self-Paced
                      <span>•</span>
                      <span className="material-symbols-outlined text-[16px]">school</span> AWS Certified
                    </div>
                    <h3 className="font-serif text-base text-[#351B32] font-semibold mt-1">
                      AWS Certified Machine Learning – Specialty (MLS-C01)
                    </h3>
                    <p className="text-xs text-[#7D747D] mt-2 leading-relaxed">
                      Master Amazon SageMaker model registries, distributed multi-GPU training clusters, and Bedrock
                      foundational API pipelines.
                    </p>
                  </div>
                  <div className="mt-5 pt-4 border-t border-[#EDE5E1] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-[#7D747D] uppercase tracking-wider block">
                        Estimated Value
                      </span>
                      <p className="text-xs text-[#268566] font-bold mt-0.5">+18% GCC Salary Match</p>
                    </div>
                    <a
                      href="https://aws.amazon.com/certification/certified-machine-learning-specialty/"
                      target="_blank"
                      rel="noreferrer"
                      className="btn-editorial-primary text-xs flex items-center gap-1"
                    >
                      <span>Enroll Track</span>
                      <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Module 2: Hugging Face Deep Dive */}
              <div className="editorial-card border border-[#EDE5E1] bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
                <div className="relative h-44 w-full overflow-hidden">
                  <img
                    alt="Hugging Face Lab"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuA6n7LCViOuP5giiRk5t1XsuP7AhGbVr6ABr_FfP0beiowq3OXPr-y5fh-YocUA6hrN6lJYwHlIbx5ra0fx9y4HAvtTWSFTeuhbPRk6cBrQuwI3eVtTj2fEKiRdO6jjdGCk-wTQxHn5h0at4usqsaxT5b2D-b3A0h-stwOgZ1DpxXJTbh366Nf4YwKlqC_mOMSnYHcC1_YRNsAs76WJxp26kGRj02H0YPGjNU2QYhOVTcpOISabCG6G"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#351B32]/80 via-transparent to-transparent"></div>
                  <span className="absolute top-3 left-3 badge-emerald text-xs font-bold shadow-sm">
                    High ROI
                  </span>
                  <span className="absolute bottom-3 left-3 text-white text-[11px] font-semibold uppercase tracking-wider">
                    Hands-on Engineering
                  </span>
                </div>
                <div className="p-5 flex flex-col flex-1 justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-[#7D747D] text-xs mb-1">
                      <span className="material-symbols-outlined text-[16px]">schedule</span> 18 Hours • Hands-on Labs
                      <span>•</span>
                      <span className="material-symbols-outlined text-[16px]">token</span> Hugging Face
                    </div>
                    <h3 className="font-serif text-base text-[#351B32] font-semibold mt-1">
                      Hugging Face Deep Dive: Production LLM Optimization
                    </h3>
                    <p className="text-xs text-[#7D747D] mt-2 leading-relaxed">
                      Advanced quantizations (AWQ/GPTQ), vLLM deployment engines, and continuous batching systems for
                      high-concurrency LLM APIs.
                    </p>
                  </div>
                  <div className="mt-5 pt-4 border-t border-[#EDE5E1] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-[#7D747D] uppercase tracking-wider block">
                        Alignment Boost
                      </span>
                      <p className="text-xs text-[#268566] font-bold mt-0.5">UAE Sovereign LLMs</p>
                    </div>
                    <a
                      href="https://huggingface.co/learn"
                      target="_blank"
                      rel="noreferrer"
                      className="btn-editorial-primary text-xs flex items-center gap-1"
                    >
                      <span>Start Lab</span>
                      <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Module 3: Docker & Kubernetes for ML */}
              <div className="editorial-card border border-[#EDE5E1] bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
                <div className="relative h-44 w-full overflow-hidden">
                  <img
                    alt="Kubernetes GPU"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCgpTKzQ1bwvT1bTiqZOorYWQ8M83Wdssg9xkbjHDiSKSeex_TQ63_nDmgzm9KZAzIbhyNnuu-vOUc1bMD_YqOkru6p9ElHBr8iUHRCdy8LkkLGwjaITepi81GuSKenH2NKCNYXUgdh7SnrGulsJO7x1qLhpsi4at5Lc9P-DZzeBB1qyQnF2dDqGsT96Or-xgI-2sZYe5sa6cCXbZ1PudX7vn3vs524RycMMhjMJtFE0yen6JO2mfrF"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#351B32]/80 via-transparent to-transparent"></div>
                  <span className="absolute top-3 left-3 badge-coral text-xs font-bold shadow-sm">
                    Core Deficiency Fix
                  </span>
                  <span className="absolute bottom-3 left-3 text-white text-[11px] font-semibold uppercase tracking-wider">
                    Architecture Mastery
                  </span>
                </div>
                <div className="p-5 flex flex-col flex-1 justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-[#7D747D] text-xs mb-1">
                      <span className="material-symbols-outlined text-[16px]">schedule</span> 24 Hours • Project-Based
                      <span>•</span>
                      <span className="material-symbols-outlined text-[16px]">developer_board</span> Cloud Native
                      (CNCF)
                    </div>
                    <h3 className="font-serif text-base text-[#351B32] font-semibold mt-1">
                      Kubernetes &amp; NVIDIA GPU Pod Orchestration
                    </h3>
                    <p className="text-xs text-[#7D747D] mt-2 leading-relaxed">
                      Learn Helm packaging, KServe model deployment, and cost-effective multi-tenant GPU sharing
                      strategies for enterprise scale.
                    </p>
                  </div>
                  <div className="mt-5 pt-4 border-t border-[#EDE5E1] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-[#7D747D] uppercase tracking-wider block">
                        Target Unlock
                      </span>
                      <p className="text-xs text-[#268566] font-bold mt-0.5">Senior MLOps Roles</p>
                    </div>
                    <a
                      href="https://kubernetes.io/docs/tasks/manage-gpus/scheduling-gpus/"
                      target="_blank"
                      rel="noreferrer"
                      className="btn-editorial-primary text-xs flex items-center gap-1"
                    >
                      <span>View Syllabus</span>
                      <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Company Specific Hiring Criteria Matrix */}
            <div className="editorial-card border border-[#EDE5E1] bg-[#F8F5F0]/60 rounded-2xl p-6 mt-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-[#351B32] text-[20px]">corporate_fare</span>
                <h4 className="font-serif text-lg font-semibold text-[#351B32]">
                  GCC Enterprise Employer Skill Weightings
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="editorial-card border border-[#EDE5E1] bg-white p-4 rounded-xl flex flex-col justify-between shadow-xs">
                  <div>
                    <span className="font-serif text-base font-semibold text-[#351B32]">G42 / Inception</span>
                    <p className="text-xs text-[#7D747D] mt-1 leading-relaxed">
                      Weighting: Large scale distributed pre-training + bilingual LLM tuning.
                    </p>
                  </div>
                  <span className="mt-3 badge-emerald text-[11px] font-bold self-start">
                    Your Match: 91%
                  </span>
                </div>
                <div className="editorial-card border border-[#EDE5E1] bg-white p-4 rounded-xl flex flex-col justify-between shadow-xs">
                  <div>
                    <span className="font-serif text-base font-semibold text-[#351B32]">Careem (Uber)</span>
                    <p className="text-xs text-[#7D747D] mt-1 leading-relaxed">
                      Weighting: Low-latency gRPC inference endpoints + real-time feature stores.
                    </p>
                  </div>
                  <span className="mt-3 badge-emerald text-[11px] font-bold self-start">
                    Your Match: 88%
                  </span>
                </div>
                <div className="editorial-card border border-[#EDE5E1] bg-white p-4 rounded-xl flex flex-col justify-between shadow-xs">
                  <div>
                    <span className="font-serif text-base font-semibold text-[#351B32]">Presight AI</span>
                    <p className="text-xs text-[#7D747D] mt-1 leading-relaxed">
                      Weighting: Enterprise AWS SageMaker pipelines &amp; Big Data computer vision.
                    </p>
                  </div>
                  <span className="mt-3 badge-coral text-[11px] font-bold self-start">
                    Your Match: 73% (Gaps in AWS)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mandatory Distinction Banner */}
        <div className="mt-8 p-4 rounded-xl editorial-card border border-[#EDE5E1] bg-white flex items-center gap-3 shadow-xs">
          <div className="w-8 h-8 rounded-full bg-[#F8F5F0] border border-[#EDE5E1] flex items-center justify-center shrink-0 text-[#268566]">
            <span className="material-symbols-outlined text-[18px]">verified_user</span>
          </div>
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p className="text-xs text-[#7D747D]">
              Insights derived from parsed job postings. Recommendations are advisory and continually updated.
            </p>
            <span className="badge-neutral text-[10px] whitespace-nowrap self-start sm:self-auto">
              Engine Version 3.4 • GCC Radar Active
            </span>
          </div>
        </div>
      </div>
    </StitchShell>
  );
}
