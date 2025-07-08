
'use client';

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpenCheck, PlusCircle, Edit2, Trash2, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import type { KnowledgeArticle } from '@/types/knowledge';
import { knowledgeArticleCategories } from '@/types/knowledge';
import { useUserProfile } from '@/contexts/user-profile-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';


const articleFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters.").max(150),
  category: z.enum(knowledgeArticleCategories, { required_error: "Category is required." }),
  content: z.string().min(50, "Content must be at least 50 characters."),
});

type ArticleFormValues = z.infer<typeof articleFormSchema>;

const ARTICLES_COLLECTION = 'knowledgeArticles';
const ARTICLE_FORM_ID = 'article-form';

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<KnowledgeArticle | null>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();

  const form = useForm<ArticleFormValues>({
    resolver: zodResolver(articleFormSchema),
    defaultValues: { title: '', category: undefined, content: '' },
  });
  
  useEffect(() => {
    if (isProfileLoading) return;
    if (!userProfile?.userId) {
      if (!isProfileLoading) setError("Your user profile could not be loaded. Cannot fetch knowledge base articles.");
      setIsLoading(false);
      return;
    }

    const fetchArticles = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const q = query(
          collection(db, ARTICLES_COLLECTION),
          where("authorId", "==", userProfile.userId),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        setArticles(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KnowledgeArticle)));
      } catch (e: any) {
        setError("Failed to load articles. This may be due to missing permissions or a required Firestore index. Please check the README and developer console for more information.");
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchArticles();
  }, [userProfile, isProfileLoading]);

  const handleOpenModal = (articleToEdit?: KnowledgeArticle) => {
    setEditingArticle(articleToEdit || null);
    form.reset(articleToEdit || { title: '', category: undefined, content: '' });
    setIsModalOpen(true);
  };
  
  const onSubmit: SubmitHandler<ArticleFormValues> = async (data) => {
    if (!userProfile?.userId || !userProfile.fullName) {
      toast({ title: "Error", description: "User profile is incomplete.", variant: "destructive" });
      return;
    }

    const articleData = {
      ...data,
      authorId: userProfile.userId,
      authorName: userProfile.fullName,
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingArticle) {
        const articleRef = doc(db, ARTICLES_COLLECTION, editingArticle.id);
        await updateDoc(articleRef, articleData);
        setArticles(articles.map(a => a.id === editingArticle.id ? { ...a, ...articleData, updatedAt: new Date().toISOString() } as KnowledgeArticle : a));
        toast({ title: "Article Updated", description: `Article "${data.title}" has been updated.` });
      } else {
        const docRef = await addDoc(collection(db, ARTICLES_COLLECTION), { ...articleData, createdAt: serverTimestamp() });
        const newArticle = { ...articleData, id: docRef.id, createdAt: new Date().toISOString() } as KnowledgeArticle;
        setArticles(prev => [newArticle, ...prev]);
        toast({ title: "Article Created", description: `Article "${data.title}" has been published.` });
      }
      setIsModalOpen(false);
    } catch (e: any) {
      toast({ title: "Error", description: `Failed to save article: ${e.message}`, variant: "destructive" });
    }
  };

  const handleDelete = async (articleId: string) => {
    await deleteDoc(doc(db, ARTICLES_COLLECTION, articleId));
    toast({ title: "Article Deleted", variant: "destructive" });
    setArticles(articles.filter(a => a.id !== articleId));
  };
  
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : parseISO(timestamp);
    return isValid(date) ? format(date, 'PP') : 'Invalid Date';
  };

  if (isProfileLoading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="ml-3 text-lg text-muted-foreground">Loading Knowledge Base...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="AEO Knowledge Base"
        icon={BookOpenCheck}
        description="Create, manage, and share training materials, guides, and best practices."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/aeo/dashboard')}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Button>
            <Button onClick={() => handleOpenModal()}><PlusCircle className="mr-2 h-4 w-4" /> Create New Article</Button>
          </div>
        }
      />
      
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader><DialogTitle>{editingArticle ? 'Edit' : 'Create New'} Article</DialogTitle></DialogHeader>
          <div className="flex-grow overflow-y-auto pr-2 py-4">
            <Form {...form}>
              <form id={ARTICLE_FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField name="title" control={form.control} render={({ field }) => (<FormItem><FormLabel>Article Title*</FormLabel><FormControl><Input placeholder="e.g., How to Identify Fall Armyworm" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="category" control={form.control} render={({ field }) => (<FormItem><FormLabel>Category*</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl><SelectContent>{knowledgeArticleCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField name="content" control={form.control} render={({ field }) => (<FormItem><FormLabel>Content*</FormLabel><FormControl><Textarea placeholder="Write the full content of the article here. You can use simple formatting." className="min-h-[250px]" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </form>
            </Form>
          </div>
          <DialogFooter className="border-t pt-4"><DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose><Button type="submit" form={ARTICLE_FORM_ID}>{editingArticle ? 'Save Changes' : 'Publish Article'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <CardDescription>{error}</CardDescription>
        </Alert>
      )}

      <Card className="shadow-lg">
        <CardHeader><CardTitle>My Published Articles</CardTitle><CardDescription>A list of all knowledge base articles you have created.</CardDescription></CardHeader>
        <CardContent>
          {articles.length > 0 ? (
            <Table>
              <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Category</TableHead><TableHead>Last Updated</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {articles.map(article => (
                  <TableRow key={article.id}>
                    <TableCell className="font-medium">{article.title}</TableCell>
                    <TableCell><Badge variant="secondary">{article.category}</Badge></TableCell>
                    <TableCell>{formatDate(article.updatedAt)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenModal(article)}><Edit2 className="h-3.5 w-3.5 mr-1"/>Edit</Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(article.id)}><Trash2 className="h-3.5 w-3.5 mr-1"/>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <BookOpenCheck className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">You haven't published any articles yet.</p>
              <p className="text-sm text-muted-foreground">Click "Create New Article" to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
