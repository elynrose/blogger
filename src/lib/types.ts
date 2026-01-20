export type AffiliateLink = {
  text: string;
  url: string;
};

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  imageHint: string;
  author: string;
  authorImageUrl: string;
  authorImageHint: string;
  date: string;
  content: string; 
  videoUrl?: string;
  affiliateLinks?: AffiliateLink[];
  tags?: string[];
};
