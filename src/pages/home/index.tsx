import ServiceMenu from './service-menu';
import QuickActions from './quick-actions';
import SearchBar from '../search/search-bar';
import FeaturedServices from './featured-services';
import RemoteDiagnosis from './remote-diagnosis';
import HealthNews from './health-news';

function HomePage() {
  return (
    <>
      <SearchBar className="mx-4" />
      <QuickActions />
      <ServiceMenu />
      <FeaturedServices />
      <RemoteDiagnosis />
      <HealthNews />
    </>
  );
}

export default HomePage;
