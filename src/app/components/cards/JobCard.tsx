/* src/components/common/JobCard.tsx */
import React from 'react';
import Link from 'next/link';
import { Bookmark, DollarSign, User, Tag, Briefcase } from 'lucide-react'; 

export interface JobCardData {
  id: string;
  icon: React.ReactNode;
  title: string;
  type: string;
  postedBy: string;
  minCompensation: string;
  maxCompensation: string | null;
  details: string;
  currency: string;
  timeAgo: string;
  isFavorite: boolean;
  isVisible: boolean;
}

interface JobCardProps {
  data: JobCardData;
  isLoggedIn: boolean;
}

const JobCard: React.FC<JobCardProps> = ({ data, isLoggedIn }) => {
  const compensation = data.maxCompensation
    ? `${data.minCompensation} - ${data.maxCompensation}`
    : `${data.minCompensation}+`;

  const isFav = data.isFavorite; 
  const favBtnClass = isFav ? 'text-primary-blue-500 fill-current' : 'text-gray-400';

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 flex flex-col border border-gray-200 transition-shadow duration-300 relative hover:shadow-xl h-full">
      <div className="absolute top-4 right-6 text-xs text-blue-400">
        โพสต์เมื่อ {data.timeAgo}
      </div>

      <div className="flex items-center gap-3 mb-3 mt-4">
        {data.icon}
        <h3 className="text-lg font-semibold text-gray-800 text-left">{data.title}</h3>
      </div>

      <div className="flex flex-col items-start mb-4">
        <span className="text-xs font-medium text-primary-blue-700 bg-gray-100 px-3 py-1 rounded-full mb-1">
          {data.type}
        </span>
        <p className="text-sm text-blue-400 mt-1">โดย {data.postedBy}</p>
      </div>

      <div className="mb-4">
        <p className="text-sm font-medium text-gray-800 mb-1 text-left">คำอธิบายงาน :</p>
        <p className="text-sm text-gray-500 line-clamp-3 text-left">{data.details}</p>
      </div>

      <div className="mt-auto mb-4 flex justify-between items-center w-full">
        <p className="text-sm font-medium text-gray-800">ค่าตอบแทน</p>
        <p className="text-lg font-bold text-gray-800">{compensation} {data.currency}</p>
      </div>

      <div className="flex justify-between items-center gap-3">
        <Link href={`/find-job/${data.id}`} className="flex-grow">
          <button className="bg-primary-blue-500 text-white text-base py-3 px-4 rounded-lg w-full hover:bg-primary-blue-600 transition-colors">
            ดูรายละเอียดงาน
          </button>
        </Link>
        {isLoggedIn && (
          <button className={`p-3 rounded-lg bg-gray-100 ${favBtnClass} hover:bg-gray-200 transition-colors cursor-pointer shadow-sm`}>
            <Bookmark className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default JobCard;