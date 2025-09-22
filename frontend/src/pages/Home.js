import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './HomePage.css';

const Home = () => {
  const { t } = useTranslation();
  const [recentProjects, setRecentProjects] = useState([]);
  const [featuredStudios, setFeaturedStudios] = useState([]);
  const [upcomingMeetups, setUpcomingMeetups] = useState([]);
  const [popularMeetups, setPopularMeetups] = useState([]);
  const [newMeetups, setNewMeetups] = useState([]);
  const [topMembers, setTopMembers] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 최근 프로젝트, 추천 스튜디오, 다가오는 모임 가져오기
        const [projectsResponse, studiosResponse, meetupsResponse] = await Promise.all([
          axios.get('/api/projects/recent'),
          axios.get('/api/studios'),
          axios.get('/api/meetups/active')
        ]);

        setRecentProjects(projectsResponse.data.slice(0, 6));
        setFeaturedStudios(studiosResponse.data.slice(0, 3));
        setUpcomingMeetups(meetupsResponse.data.slice(0, 4));

        // 추가 섹션용 데이터(간단 파생)
        setPopularMeetups(meetupsResponse.data.slice(0, 6));
        setNewMeetups(meetupsResponse.data.slice(0, 6));

        // 인기 멤버(샘플: 사용자 목록 상위 N)
        try {
          const usersResp = await axios.get('/api/users');
          setTopMembers(usersResp.data.slice(0, 5));
        } catch (_) {
          setTopMembers([]);
        }

        // 친구 요청(백엔드 미구현 가정: 샘플 데이터)
        setFriendRequests([]);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(t('common.errorFetchingData'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [t]);

  const handleImageError = (e) => {
    e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="btn btn-primary">
            {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* Announcement Banner */}
      {showAnnouncement && (
        <div className="announcement-banner">
          <div className="announcement-content">
            <span className="badge">공지</span>
            <span className="announcement-text">새로운 AI 평판 필터 기능이 추가되었습니다! 이제 더 신뢰도 높은 밋업을 쉽게 찾을 수 있습니다.</span>
          </div>
          <button className="announcement-close" onClick={() => setShowAnnouncement(false)}>
            닫기
          </button>
        </div>
      )}
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="hero-overlay"></div>
          <img 
            src="/images/hero-bg.jpg" 
            alt="Creative workspace" 
            className="hero-bg-image"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            }}
          />
        </div>
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              <span className="highlight">창작자들을 위한</span><br />
              새로운 연결의 시작
            </h1>
            <p className="hero-subtitle">
              HobbyLink에서 당신의 창작 여정을 공유하고, 같은 관심사를 가진 사람들과 만나보세요.
              스튜디오를 만들고, 프로젝트를 전시하며, 즉석 모임을 통해 새로운 영감을 얻어보세요.
            </p>
            <div className="hero-actions">
              <Link to="/studios" className="btn btn-primary btn-large">
                <i className="fas fa-palette"></i>
                스튜디오 둘러보기
              </Link>
              <Link to="/meetups" className="btn btn-outline btn-large">
                <i className="fas fa-users"></i>
                모임 참여하기
              </Link>
            </div>
          </div>
          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-number">1,200+</div>
              <div className="stat-label">활성 창작자</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">850+</div>
              <div className="stat-label">창작 프로젝트</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">300+</div>
              <div className="stat-label">월간 모임</div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Lightning Request (번개 요청) */}
      <section className="lightning-section">
        <div className="container">
          <div className="lightning-card">
            <div className="lightning-info">
              <h2>긴급 번개 요청 ⚡</h2>
              <p>"지금 당장 뭐할까?" AI에게 즉석 밋업을 요청해보세요. (예: 30분 뒤 근처 카페에서 보드게임)</p>
            </div>
            <div className="lightning-action">
              <Link to="/meetups" className="btn btn-primary">요청 보내기</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header text-center">
            <h2>HobbyLink의 특별한 기능들</h2>
            <p>창작자들을 위한 완벽한 플랫폼을 경험해보세요</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-store"></i>
              </div>
              <h3>창작 스튜디오</h3>
              <p>나만의 창작 공간을 만들고 작품들을 전시해보세요. 방문자들과 소통하며 피드백을 받을 수 있습니다.</p>
              <Link to="/studios" className="feature-link">
                스튜디오 만들기 <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-project-diagram"></i>
              </div>
              <h3>프로젝트 쇼케이스</h3>
              <p>완성된 작품부터 진행 중인 프로젝트까지, 창작 과정을 투명하게 공유하고 영감을 나누세요.</p>
              <Link to="/projects" className="feature-link">
                프로젝트 보기 <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-calendar-plus"></i>
              </div>
              <h3>즉석 모임</h3>
              <p>같은 관심사를 가진 사람들과 즉석으로 만나거나 계획된 워크샵에 참여해보세요.</p>
              <Link to="/meetups" className="feature-link">
                모임 참여하기 <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-comments"></i>
              </div>
              <h3>실시간 채팅</h3>
              <p>모임 참가자들과 실시간으로 소통하고, 아이디어를 공유하며 협업의 기회를 만들어보세요.</p>
              <div className="feature-link">
                실시간 소통 <i className="fas fa-arrow-right"></i>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Studios Section */}
      {featuredStudios.length > 0 && (
        <section className="featured-studios-section">
          <div className="container">
            <div className="section-header">
              <h2>주목받는 스튜디오</h2>
              <p>창작자들의 독창적인 작업 공간을 둘러보세요</p>
              <Link to="/studios" className="view-all-btn">
                모든 스튜디오 보기 <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
            <div className="studios-grid">
              {featuredStudios.map(studio => (
                <div key={studio.id} className="studio-card">
                  <div className="studio-image">
                    <img
                      src={studio.coverImage || '/images/studio-placeholder.jpg'}
                      alt={studio.name}
                      onError={handleImageError}
                    />
                    <div className="studio-overlay">
                      <Link to={`/studios/${studio.id}`} className="studio-visit-btn">
                        스튜디오 방문
                      </Link>
                    </div>
                  </div>
                  <div className="studio-info">
                    <div className="studio-creator">
                      <img
                        src={studio.creator?.profileImageUrl || '/images/avatar-placeholder.jpg'}
                        alt={studio.creator?.username}
                        className="creator-avatar"
                        onError={(e) => e.target.src = '/images/avatar-placeholder.jpg'}
                      />
                      <div className="creator-info">
                        <h3 className="studio-name">{studio.name}</h3>
                        <p className="creator-name">by {studio.creator?.username}</p>
                      </div>
                    </div>
                    {studio.category && (
                      <span className="studio-category">{studio.category}</span>
                    )}
                  </div>
                  <p className="studio-description">
                    {studio.description?.substring(0, 100)}
                    {studio.description?.length > 100 ? '...' : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Popular Meetups Section */}
      {popularMeetups.length > 0 && (
        <section className="popular-meetups-section">
          <div className="container">
            <div className="section-header">
              <h2>인기 밋업 🔥</h2>
              <Link to="/meetups" className="view-all-btn">더보기 <i className="fas fa-arrow-right"></i></Link>
            </div>
            <div className="meetups-grid">
              {popularMeetups.map(meetup => (
                <div key={meetup.id} className="meetup-card">
                  <div className="meetup-header">
                    <div className="meetup-badges">
                      <div className="meetup-time-badge">인기</div>
                    </div>
                    <div className="meetup-category">{meetup.category || '일반'}</div>
                  </div>
                  <div className="meetup-content">
                    <h3 className="meetup-title">{meetup.title}</h3>
                    <p className="meetup-description">{meetup.description?.substring(0, 100)}{meetup.description?.length > 100 ? '...' : ''}</p>
                  </div>
                  <div className="meetup-actions">
                    <Link to={`/meetups/${meetup.id}`} className="btn btn-primary">상세보기</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recent Projects Section */}
      {recentProjects.length > 0 && (
        <section className="recent-projects-section">
          <div className="container">
            <div className="section-header">
              <h2>최신 프로젝트</h2>
              <p>창작자들의 새로운 작품들을 만나보세요</p>
              <Link to="/projects" className="view-all-btn">
                모든 프로젝트 보기 <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
            <div className="projects-grid">
              {recentProjects.map(project => (
                <div key={project.id} className="project-card">
                  <div className="project-image">
                    <img
                      src={project.imageUrl || '/images/project-placeholder.jpg'}
                      alt={project.title}
                      onError={handleImageError}
                    />
                    <div className="project-overlay">
                      <Link to={`/projects/${project.id}`} className="project-view-btn">
                        프로젝트 보기
                      </Link>
                    </div>
                  </div>
                  <div className="project-info">
                    <h3 className="project-title">{project.title}</h3>
                    <p className="project-description">
                      {project.description?.substring(0, 80)}
                      {project.description?.length > 80 ? '...' : ''}
                    </p>
                    <div className="project-meta">
                      <div className="project-creator">
                        <img
                          src={project.user?.profileImageUrl || '/images/avatar-placeholder.jpg'}
                          alt={project.user?.username}
                          className="creator-avatar-small"
                          onError={(e) => e.target.src = '/images/avatar-placeholder.jpg'}
                        />
                        <span>{project.user?.username}</span>
                      </div>
                      {project.tags && (
                        <div className="project-tags">
                          {project.tags.split(',').slice(0, 2).map((tag, index) => (
                            <span key={index} className="project-tag">{tag.trim()}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* New Meetups Section */}
      {newMeetups.length > 0 && (
        <section className="new-meetups-section">
          <div className="container">
            <div className="section-header">
              <h2>새로 등록된 밋업 ✨</h2>
              <Link to="/meetups" className="view-all-btn">더보기 <i className="fas fa-arrow-right"></i></Link>
            </div>
            <div className="meetups-grid">
              {newMeetups.map(meetup => (
                <div key={meetup.id} className="meetup-card">
                  <div className="meetup-header">
                    <div className="meetup-badges">
                      <div className="meetup-time-badge">신규</div>
                    </div>
                    <div className="meetup-category">{meetup.category || '일반'}</div>
                  </div>
                  <div className="meetup-content">
                    <h3 className="meetup-title">{meetup.title}</h3>
                    <p className="meetup-description">{meetup.description?.substring(0, 100)}{meetup.description?.length > 100 ? '...' : ''}</p>
                  </div>
                  <div className="meetup-actions">
                    <Link to={`/meetups/${meetup.id}`} className="btn btn-primary">상세보기</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Upcoming Meetups Section */}
      {upcomingMeetups.length > 0 && (
        <section className="upcoming-meetups-section">
          <div className="container">
            <div className="section-header">
              <h2>다가오는 모임</h2>
              <p>창작자들과 함께하는 특별한 시간</p>
              <Link to="/meetups" className="view-all-btn">
                모든 모임 보기 <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
            <div className="meetups-grid">
              {upcomingMeetups.map(meetup => (
                <div key={meetup.id} className="meetup-card">
                  <div className="meetup-header">
                    <div className="meetup-badges">
                      <div className="meetup-time-badge">
                        {(() => {
                          const now = new Date();
                          const meetupTime = new Date(meetup.meetupDateTime);
                          const diffInHours = Math.ceil((meetupTime - now) / (1000 * 60 * 60));

                          if (diffInHours < 1) {
                            return '곧 시작';
                          } else if (diffInHours < 24) {
                            return `${diffInHours}시간 후`;
                          } else {
                            const diffInDays = Math.ceil(diffInHours / 24);
                            return `${diffInDays}일 후`;
                          }
                        })()}
                      </div>
                      {meetup.type === 'SPONTANEOUS' && (
                        <div className="spontaneous-badge">
                          즉석 모임
                        </div>
                      )}
                    </div>
                    <div className="meetup-category">
                      {meetup.category || '일반'}
                    </div>
                  </div>
                  <div className="meetup-content">
                    <h3 className="meetup-title">{meetup.title}</h3>
                    <p className="meetup-description">
                      {meetup.description?.substring(0, 100)}
                      {meetup.description?.length > 100 ? '...' : ''}
                    </p>
                    <div className="meetup-details">
                      <div className="meetup-detail">
                        <i className="fas fa-calendar"></i>
                        <span>{new Date(meetup.meetupDateTime).toLocaleDateString('ko-KR')}</span>
                      </div>
                      <div className="meetup-detail">
                        <i className="fas fa-clock"></i>
                        <span>{new Date(meetup.meetupDateTime).toLocaleTimeString('ko-KR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}</span>
                      </div>
                      {meetup.location && (
                        <div className="meetup-detail">
                          <i className="fas fa-map-marker-alt"></i>
                          <span>{meetup.location}</span>
                        </div>
                      )}
                      <div className="meetup-detail">
                        <i className="fas fa-users"></i>
                        <span>
                          {meetup.currentParticipants || 0}
                          {meetup.maxParticipants && ` / ${meetup.maxParticipants}`} 명
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="meetup-actions">
                    <Link to={`/meetups/${meetup.id}`} className="btn btn-primary">
                      <i className="fas fa-plus"></i>
                      참여하기
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Top Members Section */}
      {topMembers.length > 0 && (
        <section className="top-members-section">
          <div className="container">
            <div className="section-header">
              <h2>요즘 인기있는 멤버 ⭐</h2>
              <Link to="/search?type=users" className="view-all-btn">더보기 <i className="fas fa-arrow-right"></i></Link>
            </div>
            <div className="members-grid">
              {topMembers.map(member => (
                <div key={member.id} className="member-card">
                  <img src={member.profileImageUrl || '/images/avatar-placeholder.jpg'} alt={member.username} onError={(e) => e.target.src = '/images/avatar-placeholder.jpg'} />
                  <div className="member-info">
                    <div className="member-name">{member.username}</div>
                    <div className="member-handle">@{member.username}</div>
                  </div>
                  <Link to={`/profile/${member.id}`} className="btn btn-outline">프로필</Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Friend Requests Section (placeholder) */}
      {friendRequests.length > 0 && (
        <section className="friend-requests-section">
          <div className="container">
            <div className="section-header">
              <h2>친구 요청</h2>
            </div>
            <div className="requests-list">
              {friendRequests.map(req => (
                <div key={req.id} className="request-item">
                  <div className="request-user">
                    <img src={req.profileImageUrl || '/images/avatar-placeholder.jpg'} alt={req.username} onError={(e) => e.target.src = '/images/avatar-placeholder.jpg'} />
                    <div>
                      <div className="request-name">{req.username}</div>
                      <div className="request-handle">@{req.handle || req.username}</div>
                    </div>
                  </div>
                  <div className="request-actions">
                    <button className="btn btn-outline">거절</button>
                    <button className="btn btn-primary">수락</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>지금 바로 시작해보세요!</h2>
            <p>HobbyLink와 함께 창작의 새로운 가능성을 발견하고, 전 세계 창작자들과 연결되어보세요.</p>
            <div className="cta-actions">
              <Link to="/studios" className="btn btn-primary btn-large">
                <i className="fas fa-rocket"></i>
                스튜디오 만들기
              </Link>
              <Link to="/about" className="btn btn-outline btn-large">
                <i className="fas fa-info-circle"></i>
                더 알아보기
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;