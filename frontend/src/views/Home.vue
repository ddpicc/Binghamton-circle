<template>
  <div class="home">
    <NavHeader />

    <!-- 全屏英雄区 -->
    <div class="hero-section">
      <!-- 背景轮播 -->
      <div class="carousel-container">
        <el-carousel height="100vh" :interval="5000" trigger="click" arrow="always" indicator-position="none">
          <el-carousel-item v-for="(slide, idx) in slides" :key="idx">
            <div class="banner" :style="bannerStyle(slide.image)">
              <div class="banner-mask"></div>
              <div class="banner-content">
                <h1 class="banner-title">{{ slide.title }}</h1>
              </div>
            </div>
          </el-carousel-item>
        </el-carousel>
      </div>

      <!-- 底部通知模块 -->
      <div class="notice-section">
        <div class="notice-card">
          <div class="notice-card-header">
            <el-icon class="notice-icon"><Bell /></el-icon>
            <span class="notice-title">重要通知</span>
          </div>
          <div class="notice-content">
            <el-carousel
              height="24px"
              direction="vertical"
              :autoplay="true"
              :interval="3000"
              indicator-position="none"
              class="notice-carousel"
            >
              <el-carousel-item class="notice-item urgent" @click="go('/notices')">
                <span class="notice-tag">紧急</span>
                <span class="notice-text">9月15日中秋晚会报名通道开启，限200人</span>
              </el-carousel-item>
              <el-carousel-item class="notice-item" @click="go('/notices')">
                <span class="notice-tag">提醒</span>
                <span class="notice-text">ISSS签证更新讲座时间调整为9月20日14:00</span>
              </el-carousel-item>
              <el-carousel-item class="notice-item" @click="go('/notices')">
                <span class="notice-tag">活动</span>
                <span class="notice-text">10月1日国庆节联欢晚会筹备中，欢迎报名</span>
              </el-carousel-item>
            </el-carousel>
          </div>
          <div class="notice-footer">
            <el-button text bg @click="go('/notices')">查看全部 →</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 三个专题模块 -->
    <div class="topics-section">
      <div class="container">
        <h2 class="section-title">生活·学业·职业</h2>
        <p class="section-subtitle">你需要的都在这里</p>
        <div class="topic-list">
          <div 
            class="topic-item" 
            v-for="(topic, index) in topics" 
            :key="index"
            :class="[
              { 'reverse-layout': index % 2 !== 0 },
              `topic-${index === 0 ? 'academic' : index === 1 ? 'campus' : 'career'}`
            ]"
          >
            <div class="topic-item-image">
              <img :src="topic.image" :alt="topic.title" />
            </div>
            <div class="topic-item-content">
              <div class="topic-item-header">
                <span class="topic-item-subtitle">{{ topic.subtitle }}</span>
                <h3 class="topic-item-title">{{ topic.title }}</h3>
                <div class="divider"></div>
              </div>
              <p class="topic-item-description">{{ topic.description }}</p>
              <div class="topic-features">
                <span v-for="feature in topic.features" :key="feature" class="feature-tag">
                  {{ feature }}
                </span>
              </div>
              <el-button type="primary" class="topic-button" round @click="go('/academics')">
                {{ topic.buttonText }} →
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-content">
        <div class="footer-section">
          <h4>Binghamton Circle</h4>
          <p>专为 Binghamton 大学中国留学生打造的校园社区</p>
        </div>
        <div class="footer-section">
          <h4>联系我们</h4>
          <p>邮箱：binghamtonconnect@xxx.com</p>
          <p>合作：CSSA 学生会</p>
        </div>
        <div class="footer-section">
          <h4>关注我们</h4>
          <div class="social-links">
            <span>微信公众号</span>
            <span>小红书</span>
            <span>Discord</span>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <p>©2024 Binghamton Circle. All rights reserved.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import NavHeader from '@/components/NavHeader.vue'
import { Bell, Reading, Briefcase, Trophy, User, School } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import bannerLibrary from '@/assets/banner-library.jpg'
import schoolImage from '@/assets/school.jpg'
import campusLifeImage from '@/assets/campus-life.png'
import academicImage from '@/assets/academic.png'
import careerDevelopmentImage from '@/assets/career-development.png'

const router = useRouter()

const slides = [
  { 
    image: bannerLibrary,
    title: 'Pursuing Excellence from the Breadth',
    description: 'Glenn G. Bartle 图书馆 - 图书馆正面全景，突出标志性拱门与玻璃幕墙，光线明亮'
  },
  { 
    image: bannerLibrary,
    title: 'Pursuing Excellence from the Breadth',
    description: '卓越中心 - 现代风格建筑局部，强调金属质感与几何线条，体现学术创新氛围'
  },
  { 
    image: schoolImage,
    title: 'Pursuing Excellence from the Breadth',
    description: '山腰日落景色 - 从校园山腰俯瞰的日落全景，橙红色天空与远处树林，体现自然美景与校园氛围'
  }
]

const topics = [
  {
    title: '校园生活',
    subtitle: 'CAMPUS LIFE',
    description: '留学生活远不止于课堂。我们致力于为你打造一个充满活力和归属感的社区。从新生接机、租房攻略到中国胃美食地图，我们提供超过100篇由学长学姐亲笔撰写的生活指南。此外，我们与CSSA及其他超过30个学生社团紧密合作，为你带来最新、最全面的活动资讯，无论是中秋晚会、篮球比赛还是文化交流活动，你都能第一时间获取信息。在这里，发现志同道合的朋友，让你的留学生活更加精彩。',
    image: campusLifeImage,
    icon: User,
    features: ['社团活动', '文化交流', '生活指南'],
    buttonText: '加入社区'
  },
  {
    title: '学业支持',
    subtitle: 'ACADEMIC SUPPORT',
    description: '无论你是在为选择合适的课程而烦恼，还是在为复杂的学术论文而头疼，我们都能提供全方位的支持。这里汇集了海量课程评价，覆盖超过500门课程的给分情况、作业难度和教授风格的真实反馈。我们还提供丰富的学习资源库，包括中文教材、往年考题和论文润色工具。根据数据显示，超过85%的用户认为我们的课评系统帮助他们有效提升了GPA。加入我们，让学术之路不再孤单。',
    image: academicImage,
    icon: Reading,
    features: ['课程评价', '学习资源', '学术辅导'],
    buttonText: '探索学业工具'
  },
  {
    title: '职业发展',
    subtitle: 'CAREER DEVELOPMENT',
    description: '我们深知职业规划对留学生的重要性。我们的职业发展模块旨在为你连接机遇，铺就未来。我们整理了详尽的OPT/CPT申请指南，并与超过50家对国际生友好的企业建立了联系，提供内推机会和招聘信息。我们的校友网络覆盖了科技、金融、咨询等多个热门行业，已有超过200位校友导师在线分享经验、提供模拟面试。无论你的目标是留美还是回国发展，我们都将是你最坚实的后盾。',
    image: careerDevelopmentImage,
    icon: Briefcase,
    features: ['求职指导', '实习机会', '校友网络'],
    buttonText: '规划未来'
  }
]

const bannerStyle = (img: string) => ({
  backgroundImage: img ? `url(${img})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
})

const go = (path: string) => router.push(path)
</script>

<style scoped>
.home {
  --primary-color: #006633;
  --primary-dark: #005229;
  --primary-light: #e8f5e8;
  
  /* 专题模块配色方案 */
  /* 学业支持 - 智慧蓝色系 */
  --academic-primary: #2563eb;
  --academic-secondary: #3b82f6;
  --academic-light: #dbeafe;
  --academic-bg: linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%);
  
  /* 校园生活 - 活力绿色系 */
  --campus-primary: #059669;
  --campus-secondary: #10b981;
  --campus-light: #d1fae5;
  --campus-bg: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
  
  /* 职业发展 - 专业紫色系 */
  --career-primary: #7c3aed;
  --career-secondary: #8b5cf6;
  --career-light: #e9d5ff;
  --career-bg: linear-gradient(135deg, #faf5ff 0%, #ffffff 100%);
}

/* 全屏英雄区 */
.hero-section {
  position: relative;
  height: 100vh;
  width: 100%;
  overflow: hidden;
}

.carousel-container {
  position: absolute;
  inset: 0;
  z-index: 1;
}

.banner {
  width: 100%;
  height: 100%;
  background-position: center;
  background-size: cover;
  display: flex;
  align-items: center; /* 将内容从底部移动到居中 */
  justify-content: center;
}

.banner-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.5), transparent 40%);
}

.banner-content {
  position: relative;
  z-index: 2;
  text-align: center;
  color: white;
  padding: 0 20px; /* 去掉底部大间距，让内容更接近中间 */
  max-width: 800px;
  transform: translateY(-12%); /* 标题上移一些 */
}

.banner-title {
  font-size: 2.5rem;
  font-weight: 700;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.7);
  animation: slideInUp 1s ease-out;
  margin: 0;
  line-height: 1.2;
}

/* 底部通知模块 */
.notice-section {
  position: absolute;
  bottom: 60px; /* 整体上移 */
  left: 0;
  right: 0;
  z-index: 3;
  padding: 0 20px;
}

.notice-card {
  max-width: 1000px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
  padding: 16px 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  min-height: 60px;
}

.notice-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1f2937;
}

.notice-icon {
  font-size: 20px;
  color: var(--primary-color);
}

.notice-title {
  font-size: 0.9rem;
  font-weight: 600;
  white-space: nowrap;
}

.notice-content {
  flex: 1;
  overflow: hidden;
  cursor: pointer;
}

.notice-carousel {
  width: 100%;
}

.notice-item {
  display: flex !important;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
  color: #374151;
}

.notice-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  color: white;
  background-color: var(--primary-color);
}

.notice-item.urgent .notice-tag {
  background-color: #ef4444;
}

.notice-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notice-footer {
  margin-left: auto;
}
:deep(.notice-footer .el-button) {
  height: 32px;
  border-radius: 8px;
}

/* 三大核心服务 */
.topics-section {
  padding: 120px 0;
  background-color: #f9fafb;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.section-title {
  text-align: center;
  font-size: 2.8rem;
  font-weight: 800;
  color: #111827;
  margin-bottom: 12px; /* 缩小与副标题的间距 */
  position: relative;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: -15px;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 4px;
  background: var(--primary-color);
  border-radius: 2px;
}

.section-subtitle {
  text-align: center;
  color: #6b7280; /* gray-500 */
  font-size: 1.1rem;
  margin: 18px 0 80px; /* 与下方列表保持原有总间距 */
}

.topic-list {
  display: flex;
  flex-direction: column;
  gap: 100px;
}

.topic-item {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 80px;
  align-items: center;
}

.topic-item.reverse-layout {
  direction: rtl; /* Reverses the order of grid items */
}

.topic-item.reverse-layout > * {
  direction: ltr; /* Resets text direction for content */
}

.topic-item-image {
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  transition: transform 0.4s ease, box-shadow 0.4s ease;
}

.topic-item-image:hover {
  transform: scale(1.05);
  box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.3);
}

.topic-item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.topic-item-subtitle {
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.topic-item-title {
  font-size: 2.2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 16px;
}

.divider {
  width: 60px;
  height: 3px;
  margin-bottom: 24px;
  border-radius: 2px;
}

/* 学业支持专题配色 */
.topic-academic {
  background: var(--academic-bg);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(37, 99, 235, 0.1);
  transition: all 0.4s ease;
}

.topic-academic:hover {
  box-shadow: 0 20px 50px rgba(37, 99, 235, 0.15);
  transform: translateY(-5px);
}

.topic-academic .topic-item-subtitle {
  color: var(--academic-primary);
}

.topic-academic .divider {
  background: linear-gradient(90deg, var(--academic-primary), var(--academic-secondary));
}

.topic-academic .feature-tag {
  background: var(--academic-light);
  color: var(--academic-primary);
}

/* 校园生活专题配色 */
.topic-campus {
  background: var(--campus-bg);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(5, 150, 105, 0.1);
  transition: all 0.4s ease;
}

.topic-campus:hover {
  box-shadow: 0 20px 50px rgba(5, 150, 105, 0.15);
  transform: translateY(-5px);
}

.topic-campus .topic-item-subtitle {
  color: var(--campus-primary);
}

.topic-campus .divider {
  background: linear-gradient(90deg, var(--campus-primary), var(--campus-secondary));
}

.topic-campus .feature-tag {
  background: var(--campus-light);
  color: var(--campus-primary);
}

/* 职业发展专题配色 */
.topic-career {
  background: var(--career-bg);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(124, 58, 237, 0.1);
  transition: all 0.4s ease;
}

.topic-career:hover {
  box-shadow: 0 20px 50px rgba(124, 58, 237, 0.15);
  transform: translateY(-5px);
}

.topic-career .topic-item-subtitle {
  color: var(--career-primary);
}

.topic-career .divider {
  background: linear-gradient(90deg, var(--career-primary), var(--career-secondary));
}

.topic-career .feature-tag {
  background: var(--career-light);
  color: var(--career-primary);
}

.topic-item-description {
  font-size: 1rem;
  line-height: 1.7;
  color: #4b5563;
  margin-bottom: 32px;
}

.topic-features {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 32px;
}

.feature-tag {
  background: var(--primary-light);
  color: var(--primary-dark);
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.topic-button {
  font-size: 1rem;
  padding: 12px 24px;
  font-weight: 600;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
}

/* 学业支持按钮样式 */
.topic-academic .topic-button {
  background: linear-gradient(135deg, var(--academic-primary), var(--academic-secondary));
  border-color: var(--academic-primary);
  box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);
}

.topic-academic .topic-button:hover {
  background: linear-gradient(135deg, var(--academic-secondary), var(--academic-primary));
  border-color: var(--academic-secondary);
  box-shadow: 0 8px 25px rgba(37, 99, 235, 0.4);
  transform: translateY(-2px);
}

/* 校园生活按钮样式 */
.topic-campus .topic-button {
  background: linear-gradient(135deg, var(--campus-primary), var(--campus-secondary));
  border-color: var(--campus-primary);
  box-shadow: 0 4px 15px rgba(5, 150, 105, 0.3);
}

.topic-campus .topic-button:hover {
  background: linear-gradient(135deg, var(--campus-secondary), var(--campus-primary));
  border-color: var(--campus-secondary);
  box-shadow: 0 8px 25px rgba(5, 150, 105, 0.4);
  transform: translateY(-2px);
}

/* 职业发展按钮样式 */
.topic-career .topic-button {
  background: linear-gradient(135deg, var(--career-primary), var(--career-secondary));
  border-color: var(--career-primary);
  box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3);
}

.topic-career .topic-button:hover {
  background: linear-gradient(135deg, var(--career-secondary), var(--career-primary));
  border-color: var(--career-secondary);
  box-shadow: 0 8px 25px rgba(124, 58, 237, 0.4);
  transform: translateY(-2px);
}

/* Footer */
.footer {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  color: white;
  padding: 60px 0 20px;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 40px;
}

.footer-section h4 {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--primary-color);
}

.footer-section p {
  color: #ccc;
  line-height: 1.6;
  margin-bottom: 8px;
}

.social-links {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.social-links span {
  color: #ccc;
  cursor: pointer;
  transition: color 0.3s ease;
}

.social-links span:hover {
  color: var(--primary-color);
}

.footer-bottom {
  border-top: 1px solid #444;
  margin-top: 40px;
  padding-top: 20px;
  text-align: center;
  color: #999;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .hero-section {
    height: 100vh;
  }
  
  .banner-title {
    font-size: 2rem;
  }
  
  .banner-content {
    padding: 0 20px 40px; /* 减小底部内边距，上移文字 */
    transform: translateY(-6%); /* 移动端上移少一些 */
  }
  
  .notice-section {
    bottom: 30px; /* 提高通知位置 */
    padding: 0 15px;
  }
  
  .notice-card {
    padding: 12px 16px;
    gap: 12px;
    min-height: 50px;
    flex-direction: column;
    align-items: flex-start;
  }
  
  .notice-card-header {
    width: 100%;
    justify-content: center;
  }
  
  .notice-content {
    width: 100%;
  }
  
  .notice-footer {
    margin-left: 0;
    align-self: center;
  }
  
  .topics-section {
    padding: 60px 0;
  }
  
  .section-title {
    font-size: 2rem;
    margin-bottom: 8px;
  }
  
  .section-subtitle {
    font-size: 0.95rem;
    margin: 12px 0 40px;
  }
  
  .topic-list {
    gap: 60px;
  }

  .topic-item {
    grid-template-columns: 1fr;
    gap: 40px;
    direction: ltr !important; /* Reset direction for stacking */
  }

  .topic-item-title {
    font-size: 1.8rem;
  }
  
  .footer-content {
    grid-template-columns: 1fr;
    gap: 30px;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .banner-content {
    padding: 0 15px 40px;
    transform: translateY(-4%);
  }
  
  .notice-section {
    bottom: 24px; /* 超小屏再微调上移 */
  }
  
  .banner-title {
    font-size: 20px;
  }
  
  .container {
    padding: 0 15px;
  }
  
  .notice-card {
    margin: 0 15px;
    padding: 20px 15px;
  }
  
  .notice-title {
    font-size: 18px;
  }
  
  .topic-content {
    padding: 20px;
  }
}

/* 动画效果 */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* Element Plus 轮播组件样式覆盖 */
:deep(.el-carousel__indicator) {
  background-color: rgba(255, 255, 255, 0.4);
}

:deep(.el-carousel__indicator.is-active) {
  background-color: white;
}

:deep(.el-carousel__button) {
  background-color: transparent;
}
</style>
