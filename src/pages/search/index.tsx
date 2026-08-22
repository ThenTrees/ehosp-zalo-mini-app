import { searchResultState } from '@/state';
import { useAtomValue } from 'jotai';
import { useParams, useSearchParams } from 'react-router-dom';
import NotFound from '../404';
import SearchBar from './search-bar';
import { Suspense, useMemo } from 'react';
import DoctorItem from '@/components/items/doctor';
import DepartmentItem from '@/components/items/department';
import { ArticleItem } from '@/components/items/article';

function SearchResultPage() {
  const [params] = useSearchParams();
  const keyword = params.get('keyword');
  const result = useAtomValue(searchResultState(keyword ?? ''));

  const content = useMemo(() => {
    if (result.state === 'hasData') {
      const { doctors, departments, news } = result.data;

      // Check if all arrays are empty
      if (doctors.length === 0 && departments.length === 0 && news.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <p className="text-lg">Không tìm thấy kết quả nào cho "{keyword}"</p>
            <p className="text-sm mt-2">Vui lòng thử lại với từ khóa khác</p>
          </div>
        );
      }

      return (
        <>
          {doctors.map(doctor => (
            <DoctorItem withLanguages key={doctor.id} doctor={doctor} />
          ))}
          {departments.map(dep => (
            <DepartmentItem key={dep.id} item={dep} className="bg-white" />
          ))}
          {news.map(article => (
            <ArticleItem key={article.id} {...article} />
          ))}
        </>
      );
    }
    return <></>;
  }, [result, keyword]);

  return (
    <div className="space-y-6 px-4">
      <SearchBar defaultValue={keyword ?? ''} loading={result.state === 'loading'} />

      {content}
    </div>
  );
}

export default SearchResultPage;
