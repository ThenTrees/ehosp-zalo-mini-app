import Section from "@/components/section";
import TransitionLink from "@/components/transition-link";
import { articlesState } from "@/state";
import { Article } from "@/types";
import { useAtomValue } from "jotai";

export function NewsItem(news: Article) {
  return (
    <TransitionLink
      to={`/news/${news.id}`}
      className="flex w-full justify-between items-center gap-4 rounded-lg bg-white p-4"
    >
      <div className="flex-1 space-y-2">
        <h3 className="text-xs font-medium">{news.title}</h3>
        <p className="text-xs text-disabled line-clamp-1">{news.description}</p>
        <div className="flex justify-between text-xs text-disabled pt-2">
          <span>{news.category}</span>
          <span>{news.timeAgo}</span>
        </div>
      </div>
      <img
        src={news.image}
        className="h-20 w-20 rounded-lg object-cover object-center"
        alt="News thumbnail"
      />
    </TransitionLink>
  );
}

export default function HealthNews() {
  const [a1, a2, a3] = useAtomValue(articlesState);

  return (
    <Section
      className="py-4 space-y-3"
      title="Tin tức sức khỏe"
      viewMore="/explore"
    >
      <NewsItem {...a1} />
      <NewsItem {...a2} />
      <NewsItem {...a3} />
    </Section>
  );
}
