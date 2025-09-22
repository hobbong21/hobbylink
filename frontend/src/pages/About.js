import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './AboutPage.css';

const About = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: 'fas fa-palette',
      title: '창작 스튜디오',
      text: '나만의 창작 공간을 만들고 작품들을 전시하세요. 방문자들과 소통하며 피드백을 받을 수 있습니다.',
      color: '#667eea'
    },
    {
      icon: 'fas fa-project-diagram',
      title: '프로젝트 쇼케이스',
      text: '완성된 작품부터 진행 중인 프로젝트까지, 창작 과정을 투명하게 공유하고 영감을 나누세요.',
      color: '#764ba2'
    },
    {
      icon: 'fas fa-users',
      title: '즉석 모임',
      text: '같은 관심사를 가진 사람들과 즉석으로 만나거나 계획된 워크샵에 참여해보세요.',
      color: '#f093fb'
    },
    {
      icon: 'fas fa-comments',
      title: '실시간 채팅',
      text: '모임 참가자들과 실시간으로 소통하고, 아이디어를 공유하며 협업의 기회를 만들어보세요.',
      color: '#f5576c'
    },
    {
      icon: 'fas fa-search',
      title: '스마트 추천',
      text: 'AI 기반 추천 시스템으로 관심사와 위치에 맞는 하이퍼 로컬 모임을 제안받으세요.',
      color: '#4facfe'
    },
    {
      icon: 'fas fa-star',
      title: '평점 시스템',
      text: '참가자들의 평점을 통해 신뢰도를 높이고, 더 나은 모임 경험을 만들어가세요.',
      color: '#43e97b'
    },
    {
      icon: 'fas fa-shield-alt',
      title: '안전한 환경',
      text: '검증된 사용자들과 안전한 환경에서 창작 활동을 즐기고 새로운 인연을 만나보세요.',
      color: '#fa709a'
    }
  ];

  const steps = [
    {
      number: '01',
      title: '프로필 생성',
      text: '간단한 회원가입으로 시작하세요. 소셜 로그인(카카오톡, 네이버, 구글)도 지원합니다.',
      icon: 'fas fa-user-plus',
      image: '/images/step-1.jpg'
    },
    {
      number: '02',
      title: '관심사 설정',
      text: '취미와 관심사를 설정하면 맞춤형 추천을 받을 수 있습니다.',
      icon: 'fas fa-heart',
      image: '/images/step-2.jpg'
    },
    {
      number: '03',
      title: '모임 참여',
      text: '주변의 즉석 모임에 참여하거나 직접 모임을 만들어보세요.',
      icon: 'fas fa-handshake',
      image: '/images/step-3.jpg'
    },
    {
      number: '04',
      title: '네트워크 확장',
      text: '새로운 사람들과 만나고, 창작 네트워크를 확장해나가세요.',
      icon: 'fas fa-network-wired',
      image: '/images/step-4.jpg'
    }
  ];

  const stats = [
    {
      number: '1,200+',
      label: '활성 창작자',
      icon: 'fas fa-users',
      description: '매월 활발하게 활동하는 창작자들'
    },
    {
      number: '850+',
      label: '창작 프로젝트',
      icon: 'fas fa-project-diagram',
      description: '다양한 분야의 창작 프로젝트들'
    },
    {
      number: '300+',
      label: '월간 모임',
      icon: 'fas fa-calendar-alt',
      description: '매월 개최되는 창작 모임들'
    },
    {
      number: '15+',
      label: '도시',
      icon: 'fas fa-map-marker-alt',
      description: '서비스가 제공되는 주요 도시들'
    }
  ];

  const testimonials = [
    {
      name: '김민지',
      role: '일러스트레이터',
      avatar: '/images/testimonial-1.jpg',
      text: 'HobbyLink를 통해 같은 관심사를 가진 창작자들과 만날 수 있어서 정말 좋아요. 새로운 영감을 얻고 협업 기회도 많이 생겼습니다.',
      rating: 5
    },
    {
      name: '박준호',
      role: '사진작가',
      avatar: '/images/testimonial-2.jpg',
      text: '즉석 모임 기능이 정말 혁신적이에요. 갑자기 시간이 생겼을 때 바로 주변 사람들과 만날 수 있어서 너무 편리합니다.',
      rating: 5
    },
    {
      name: '이서연',
      role: '도예가',
      avatar: '/images/testimonial-3.jpg',
      text: '스튜디오 기능으로 제 작품들을 체계적으로 관리하고 전시할 수 있어요. 많은 분들이 관심을 가져주셔서 감사합니다.',
      rating: 5
    }
  ];

  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="hero-background">
          <div className="hero-particles"></div>
        </div>
        <div className="container">
          <div className="about-hero-content">
            <div className="hero-text">
              <h1>창작자들을 위한<br /><span className="highlight">새로운 연결</span></h1>
              <p className="about-subtitle">
                HobbyLink는 창작자들이 서로 만나고, 영감을 나누며, 함께 성장할 수 있는 
                혁신적인 플랫폼입니다. 당신의 창작 여정을 더욱 풍성하게 만들어보세요.
              </p>
              <div className="hero-features">
                <div className="hero-feature">
                  <i className="fas fa-check-circle"></i>
                  <span>즉석 모임 시스템</span>
                </div>
                <div className="hero-feature">
                  <i className="fas fa-check-circle"></i>
                  <span>AI 기반 추천</span>
                </div>
                <div className="hero-feature">
                  <i className="fas fa-check-circle"></i>
                  <span>실시간 채팅</span>
                </div>
              </div>
            </div>
            <div className="hero-visual">
              <div className="hero-graphic">
                <div className="floating-card card-1">
                  <i className="fas fa-palette"></i>
                  <span>스튜디오</span>
                </div>
                <div className="floating-card card-2">
                  <i className="fas fa-project-diagram"></i>
                  <span>프로젝트</span>
                </div>
                <div className="floating-card card-3">
                  <i className="fas fa-users"></i>
                  <span>모임</span>
                </div>
                <div className="floating-card card-4">
                  <i className="fas fa-comments"></i>
                  <span>채팅</span>
                </div>
                <div className="center-logo">
                  <div className="logo-circle">
                    <span className="logo-text">HobbyLink</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="about-mission">
        <div className="container">
          <div className="mission-content">
            <div className="mission-text">
              <h2>우리의 미션</h2>
              <p>
                창작은 혼자 하는 것이 아닙니다. HobbyLink는 전 세계 창작자들이 
                서로 연결되어 영감을 나누고, 함께 성장할 수 있는 생태계를 만들어갑니다.
              </p>
              <p>
                우리는 기술의 힘으로 창작자들 사이의 거리를 좁히고, 
                새로운 협업과 우정의 기회를 제공합니다.
              </p>
            </div>
            <div className="mission-visual">
              <div className="mission-image">
                <img 
                  src="/images/mission.jpg" 
                  alt="Creative collaboration" 
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<div class="placeholder-image"><i class="fas fa-lightbulb"></i></div>';
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="about-features">
        <div className="container">
          <div className="section-header">
            <h2>HobbyLink의 특별한 기능들</h2>
            <p>창작자들을 위해 특별히 설계된 혁신적인 기능들을 만나보세요</p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card" style={{'--feature-color': feature.color}}>
                <div className="feature-icon">
                  <i className={feature.icon}></i>
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="about-how-it-works">
        <div className="container">
          <div className="section-header">
            <h2>시작하는 방법</h2>
            <p>간단한 4단계로 HobbyLink의 모든 기능을 경험해보세요</p>
          </div>
          <div className="steps-container">
            {steps.map((step, index) => (
              <div key={index} className="step-item">
                <div className="step-visual">
                  <div className="step-number">{step.number}</div>
                  <div className="step-image">
                    <img 
                      src={step.image} 
                      alt={step.title}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `<div class="placeholder-step"><i class="${step.icon}"></i></div>`;
                      }}
                    />
                  </div>
                </div>
                <div className="step-content">
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="step-connector">
                    <i className="fas fa-arrow-right"></i>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="about-stats">
        <div className="container">
          <div className="section-header">
            <h2>HobbyLink과 함께하는 창작자들</h2>
            <p>매일 성장하는 창작자 커뮤니티의 일부가 되어보세요</p>
          </div>
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-item">
                <div className="stat-icon">
                  <i className={stat.icon}></i>
                </div>
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
                <div className="stat-description">{stat.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="about-testimonials">
        <div className="container">
          <div className="section-header">
            <h2>창작자들의 이야기</h2>
            <p>HobbyLink와 함께하는 창작자들의 생생한 경험담을 들어보세요</p>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="testimonial-content">
                  <div className="testimonial-rating">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <i key={i} className="fas fa-star"></i>
                    ))}
                  </div>
                  <p>"{testimonial.text}"</p>
                </div>
                <div className="testimonial-author">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name}
                    onError={(e) => e.target.src = '/images/avatar-placeholder.jpg'}
                  />
                  <div className="author-info">
                    <h4>{testimonial.name}</h4>
                    <p>{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="about-cta">
        <div className="container">
          <div className="cta-content">
            <h2>지금 바로 시작해보세요!</h2>
            <p>
              HobbyLink와 함께 창작의 새로운 가능성을 발견하고, 
              전 세계 창작자들과 연결되어보세요.
            </p>
            <div className="cta-buttons">
              <Link to="/studios" className="btn btn-primary btn-large">
                <i className="fas fa-rocket"></i>
                무료로 시작하기
              </Link>
              <Link to="/meetups" className="btn btn-outline btn-large">
                <i className="fas fa-search"></i>
                모임 둘러보기
              </Link>
            </div>
            <div className="cta-note">
              <i className="fas fa-info-circle"></i>
              <span>회원가입은 무료이며, 언제든지 시작할 수 있습니다.</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;