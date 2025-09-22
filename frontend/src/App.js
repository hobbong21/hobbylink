import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './i18n';
import Header from './components/Header';
import Home from './pages/Home';
import Studios from './pages/Studios';
import Projects from './pages/Projects';
import Meetups from './pages/Meetups';
import Profile from './pages/Profile';
import ProfileEdit from './pages/ProfileEdit';
import About from './pages/About';
import StudioDetail from './pages/StudioDetail';
import ProjectDetail from './pages/ProjectDetail';
import MeetupDetail from './pages/MeetupDetail';
import ChatPage from './pages/ChatPage';
import SearchResults from './pages/SearchResults';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/studios" element={<Studios />} />
          <Route path="/studios/:id" element={<StudioDetail />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/meetups" element={<Meetups />} />
          <Route path="/meetups/:id" element={<MeetupDetail />} />
          <Route path="/meetups/:meetupId/chat" element={<ChatPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/profile/:id/edit" element={<ProfileEdit />} />
          <Route path="/about" element={<About />} />
          <Route path="/search" element={<SearchResults />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;