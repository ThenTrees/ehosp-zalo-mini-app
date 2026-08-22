import Header from './header';
import Sidebar from './sidebar';
import RightContent from './right-content';
import SearchInput from '@/components/form/search';
import { useState } from 'react';

export default function CategoriesPage() {
  const [keyword, setKeyword] = useState('');

  return (
    <div className="overflow-hidden flex-1 flex flex-col bg-white">
      <Header />
      <SearchInput
        className="m-4 mb-0"
        value={keyword}
        onChange={e => setKeyword(e.currentTarget.value)}
      />
      <div className="relative flex pt-6 overflow-hidden">
        <Sidebar />
        <RightContent keyword={keyword} />
      </div>
    </div>
  );
}
