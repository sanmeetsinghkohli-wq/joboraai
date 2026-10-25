import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const tempDir = path.resolve('temp_docx_build');
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
fs.mkdirSync(tempDir, { recursive: true });
fs.mkdirSync(path.join(tempDir, '_rels'), { recursive: true });
fs.mkdirSync(path.join(tempDir, 'word'), { recursive: true });
fs.mkdirSync(path.join(tempDir, 'word', '_rels'), { recursive: true });

// 1. [Content_Types].xml
const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;
fs.writeFileSync(path.join(tempDir, '[Content_Types].xml'), contentTypesXml, 'utf-8');

// 2. _rels/.rels
const dotRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
fs.writeFileSync(path.join(tempDir, '_rels', '.rels'), dotRelsXml, 'utf-8');

// 3. word/_rels/document.xml.rels
const docRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
fs.writeFileSync(path.join(tempDir, 'word', '_rels', 'document.xml.rels'), docRelsXml, 'utf-8');

// 4. word/styles.xml
const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
        <w:sz w:val="21"/> <!-- 10.5 pt -->
        <w:szCs w:val="21"/>
        <w:color w:val="222222"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:line="276" w:lineRule="auto" w:before="0" w:after="72"/> <!-- 3.6pt after -->
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>

  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:spacing w:before="0" w:after="40"/>
      <w:jc w:val="center"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
      <w:b/>
      <w:bCs/>
      <w:sz w:val="40"/> <!-- 20 pt -->
      <w:szCs w:val="40"/>
      <w:color w:val="111827"/>
    </w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="SectionHeading">
    <w:name w:val="Section Heading"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:spacing w:before="240" w:after="80"/> <!-- 12pt before, 4pt after -->
      <w:pBdr>
        <w:bottom w:val="single" w:sz="6" w:space="1" w:color="CBD5E1"/>
      </w:pBdr>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
      <w:b/>
      <w:bCs/>
      <w:caps/>
      <w:sz w:val="24"/> <!-- 12 pt -->
      <w:szCs w:val="24"/>
      <w:color w:val="0F172A"/>
    </w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="BulletItem">
    <w:name w:val="Bullet Item"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:ind w:left="360" w:hanging="240"/>
      <w:spacing w:before="20" w:after="40"/>
    </w:pPr>
  </w:style>
</w:styles>`;
fs.writeFileSync(path.join(tempDir, 'word', 'styles.xml'), stylesXml, 'utf-8');

// Helper to escape XML
function xml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// 5. word/document.xml
const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>

    <!-- CANDIDATE HEADER (CENTERED, CLEAN TEXT) -->
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading1"/>
        <w:jc w:val="center"/>
        <w:spacing w:before="0" w:after="40"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="44"/>
          <w:color w:val="0F172A"/>
        </w:rPr>
        <w:t>ELENA ROSTOVA</w:t>
      </w:r>
    </w:p>

    <!-- TARGET TITLE -->
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:before="0" w:after="60"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="24"/>
          <w:color w:val="334155"/>
        </w:rPr>
        <w:t>Senior AI &amp; Cloud Infrastructure Engineer</w:t>
      </w:r>
    </w:p>

    <!-- CONTACT DETAILS (SELECTABLE TEXT, NO ICONS OR TABLES) -->
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:before="0" w:after="180"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:sz w:val="20"/><w:color w:val="475569"/></w:rPr>
        <w:t>Dubai, United Arab Emirates  •  +971 50 123 4567  •  elena.rostova@example.com</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:before="0" w:after="220"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:sz w:val="19"/><w:color w:val="2563EB"/></w:rPr>
        <w:t>linkedin.com/in/elena-rostova  •  github.com/elena-rostova  •  jobora.ai/p/elena-rostova</w:t>
      </w:r>
    </w:p>

    <!-- SECTION 1: PROFESSIONAL SUMMARY -->
    <w:p>
      <w:pPr>
        <w:pStyle w:val="SectionHeading"/>
      </w:pPr>
      <w:r>
        <w:t>Professional Summary</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:before="40" w:after="140"/></w:pPr>
      <w:r>
        <w:t>Results-driven AI Systems and Cloud Infrastructure Engineer with 6+ years of experience designing high-throughput distributed architectures, optimizing LLM inference serving, and orchestrating enterprise CI/CD pipelines. Proven record of reducing tail latency by 41% and ingesting over 1.2M events daily with 99.98% uptime across multi-region AWS and Kubernetes clusters. Adept at cross-functional leadership, technical mentorship, and aligning engineering outcomes with business velocity.</w:t>
      </w:r>
    </w:p>

    <!-- SECTION 2: CORE COMPETENCIES -->
    <w:p>
      <w:pPr>
        <w:pStyle w:val="SectionHeading"/>
      </w:pPr>
      <w:r>
        <w:t>Core Competencies &amp; Technical Skills</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:before="40" w:after="40"/></w:pPr>
      <w:r><w:rPr><w:b/></w:rPr><w:t>Languages &amp; Runtimes: </w:t></w:r>
      <w:r><w:t>Python, Go (Golang), TypeScript, Node.js, SQL (PostgreSQL, MySQL), Bash</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:before="20" w:after="40"/></w:pPr>
      <w:r><w:rPr><w:b/></w:rPr><w:t>AI, ML &amp; Vector Systems: </w:t></w:r>
      <w:r><w:t>PyTorch, Hugging Face Transformers, vLLM, TensorRT-LLM, Qdrant, Pinecone, LangChain, LlamaIndex</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:before="20" w:after="40"/></w:pPr>
      <w:r><w:rPr><w:b/></w:rPr><w:t>Cloud &amp; DevOps: </w:t></w:r>
      <w:r><w:t>AWS (ECS, EKS, EC2, S3, RDS), Kubernetes, Docker, Terraform, GitHub Actions, Redis, Kafka</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:before="20" w:after="140"/></w:pPr>
      <w:r><w:rPr><w:b/></w:rPr><w:t>Architecture &amp; Practices: </w:t></w:r>
      <w:r><w:t>Microservices, RESTful &amp; gRPC APIs, Event-Driven Architecture, CI/CD, Zero-Trust Security, Observability (Prometheus, Grafana)</w:t></w:r>
    </w:p>

    <!-- SECTION 3: PROFESSIONAL EXPERIENCE -->
    <w:p>
      <w:pPr>
        <w:pStyle w:val="SectionHeading"/>
      </w:pPr>
      <w:r>
        <w:t>Professional Experience</w:t>
      </w:r>
    </w:p>

    <!-- Job 1 -->
    <w:p>
      <w:pPr><w:spacing w:before="60" w:after="20"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="22"/></w:rPr><w:t>Staff AI Infrastructure Engineer</w:t></w:r>
      <w:r><w:t>  |  Apex Cloud Technologies  |  Dubai, UAE</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:before="0" w:after="60"/></w:pPr>
      <w:r><w:rPr><w:i/><w:color w:val="64748B"/><w:sz w:val="20"/></w:rPr><w:t>January 2023 – Present</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:pStyle w:val="BulletItem"/></w:pPr>
      <w:r><w:rPr><w:b/></w:rPr><w:t>• </w:t></w:r>
      <w:r><w:t>Architected and deployed an asynchronous multi-tenant RAG serving layer using vLLM and Qdrant, handling 450,000+ daily semantic queries with sub-120ms p95 latency.</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:pStyle w:val="BulletItem"/></w:pPr>
      <w:r><w:rPr><w:b/></w:rPr><w:t>• </w:t></w:r>
      <w:r><w:t>Integrated 4-bit AWQ weight quantization across open-weight models, slashing GPU memory consumption by 38% and saving $42,000 in monthly AWS EC2 infrastructure costs.</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:pStyle w:val="BulletItem"/></w:pPr>
      <w:r><w:rPr><w:b/></w:rPr><w:t>• </w:t></w:r>
      <w:r><w:t>Engineered automated continuous evaluation pipelines in GitHub Actions, benchmarking semantic precision and hallucination drift prior to production rollouts.</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:pStyle w:val="BulletItem"/></w:pPr>
      <w:r><w:rPr><w:b/></w:rPr><w:t>• </w:t></w:r>
      <w:r><w:t>Mentored a team of 7 software engineers in distributed systems design, asynchronous I/O patterns, and production incident response.</w:t></w:r>
    </w:p>

    <!-- Job 2 -->
    <w:p>
      <w:pPr><w:spacing w:before="120" w:after="20"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="22"/></w:rPr><w:t>Senior Cloud Backend Engineer</w:t></w:r>
      <w:r><w:t>  |  DataNexus Systems  |  Abu Dhabi, UAE</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:before="0" w:after="60"/></w:pPr>
      <w:r><w:rPr><w:i/><w:color w:val="64748B"/><w:sz w:val="20"/></w:rPr><w:t>June 2020 – December 2022</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:pStyle w:val="BulletItem"/></w:pPr>
      <w:r><w:rPr><w:b/></w:rPr><w:t>• </w:t></w:r>
      <w:r><w:t>Designed and maintained a fault-tolerant distributed web crawler in Go and Redis, extracting and transforming 1.2M records daily across 28 global endpoints.</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:pStyle w:val="BulletItem"/></w:pPr>
      <w:r><w:rPr><w:b/></w:rPr><w:t>• </w:t></w:r>
      <w:r><w:t>Optimized memory allocations using zero-copy buffer pooling in Go routines, reducing garbage collection pauses by 45% under sustained high load.</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:pStyle w:val="BulletItem"/></w:pPr>
      <w:r><w:rPr><w:b/></w:rPr><w:t>• </w:t></w:r>
      <w:r><w:t>Migrated legacy monolithic services to containerized Kubernetes deployments on AWS EKS with zero-downtime blue/green rollouts.</w:t></w:r>
    </w:p>

    <!-- SECTION 4: EDUCATION -->
    <w:p>
      <w:pPr>
        <w:pStyle w:val="SectionHeading"/>
      </w:pPr>
      <w:r>
        <w:t>Education</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:before="60" w:after="20"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="22"/></w:rPr><w:t>Master of Science in Computer Science &amp; Distributed Systems</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:before="0" w:after="40"/></w:pPr>
      <w:r><w:t>Khalifa University  |  Abu Dhabi, UAE  |  Graduated: 2020  |  GPA: 3.92 / 4.0</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:before="0" w:after="60"/></w:pPr>
      <w:r><w:rPr><w:i/><w:color w:val="475569"/></w:rPr><w:t>Relevant Coursework: Distributed Operating Systems, Advanced Algorithmic Complexity, Machine Learning Systems, Database Internals.</w:t></w:r>
    </w:p>

    <!-- SECTION 5: TECHNICAL PROJECTS -->
    <w:p>
      <w:pPr>
        <w:pStyle w:val="SectionHeading"/>
      </w:pPr>
      <w:r>
        <w:t>Technical Projects &amp; Open Source</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:before="60" w:after="20"/></w:pPr>
      <w:r><w:rPr><w:b/></w:rPr><w:t>OmniVector — High-Throughput Embedding Service (Go, gRPC, Qdrant)</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:pStyle w:val="BulletItem"/></w:pPr>
      <w:r><w:rPr><w:b/></w:rPr><w:t>• </w:t></w:r>
      <w:r><w:t>Built an open-source gRPC microservice facilitating batch vector embeddings across ONNX and TensorRT backends, achieving 8,200 vectors/sec throughput.</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:before="80" w:after="20"/></w:pPr>
      <w:r><w:rPr><w:b/></w:rPr><w:t>AgentPulse — Multi-Agent Observability Toolkit (Python, OpenTelemetry)</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:pStyle w:val="BulletItem"/></w:pPr>
      <w:r><w:rPr><w:b/></w:rPr><w:t>• </w:t></w:r>
      <w:r><w:t>Authored an instrumentation library tracing agentic tool calls, token budgets, and step latency across LangGraph and custom ReAct loops.</w:t></w:r>
    </w:p>

    <!-- SECTION 6: CERTIFICATIONS -->
    <w:p>
      <w:pPr>
        <w:pStyle w:val="SectionHeading"/>
      </w:pPr>
      <w:r>
        <w:t>Certifications &amp; Credentials</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr><w:pStyle w:val="BulletItem"/></w:pPr>
      <w:r><w:rPr><w:b/></w:rPr><w:t>• </w:t></w:r>
      <w:r><w:t>AWS Certified Solutions Architect – Professional (SAP-C02)</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:pStyle w:val="BulletItem"/></w:pPr>
      <w:r><w:rPr><w:b/></w:rPr><w:t>• </w:t></w:r>
      <w:r><w:t>Certified Kubernetes Administrator (CKA) – Cloud Native Computing Foundation</w:t></w:r>
    </w:p>

    <!-- SECTION PROPERTIES (PAGE MARGINS: 1 INCH = 1440 DXA) -->
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/> <!-- Standard Letter 8.5 x 11 inches -->
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"
               w:header="720" w:footer="720" w:gutter="0"/>
      <w:cols w:space="720"/>
      <w:docGrid w:linePitch="360"/>
    </w:sectPr>

  </w:body>
</w:document>`;
fs.writeFileSync(path.join(tempDir, 'word', 'document.xml'), documentXml, 'utf-8');

console.log('OpenXML files written successfully to temp directory.');
