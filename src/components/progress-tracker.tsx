
"use client";

import * as React from 'react';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { SolvedProblem } from '@/types';
import { Icons, getIconForProblemType } from '@/components/icons';
import { ProblemForm } from './problem-form';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from 'lucide-react'; // Bookmark icon removed as Icons.Bookmark is used
import { useToast } from '@/hooks/use-toast';


interface ProgressTrackerProps {
  solvedProblems: SolvedProblem[];
  onUpdateProblem: (problem: SolvedProblem) => void;
  onRemoveProblem: (problemId: string) => void;
  toggleProblemReviewStatus: (problemId: string) => void;
}

export function ProgressTracker({ solvedProblems, onUpdateProblem, onRemoveProblem, toggleProblemReviewStatus }: ProgressTrackerProps) {
  const [editingProblem, setEditingProblem] = React.useState<SolvedProblem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [problemToRemove, setProblemToRemove] = React.useState<SolvedProblem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const { toast } = useToast();


  const handleEdit = (problem: SolvedProblem) => {
    setEditingProblem(problem);
    setIsEditDialogOpen(true);
  };

  const handleUpdateProblem = (updatedProblem: SolvedProblem) => {
    onUpdateProblem(updatedProblem);
    setIsEditDialogOpen(false);
    setEditingProblem(null);
  };

  const handleConfirmRemove = (problem: SolvedProblem) => {
    setProblemToRemove(problem);
    setIsDeleteDialogOpen(true);
  };
  
  const executeRemove = () => {
    if (problemToRemove) {
      onRemoveProblem(problemToRemove.id);
      toast({ title: "Problem Removed", description: `"${problemToRemove.title}" has been deleted.`});
      setIsDeleteDialogOpen(false);
      setProblemToRemove(null);
    }
  };

  const handleToggleReview = (problem: SolvedProblem) => {
    toggleProblemReviewStatus(problem.id);
    toast({
      title: "Review Status Updated",
      description: `"${problem.title}" is ${!problem.isForReview ? "now" : "no longer"} marked for review.`
    });
  };

  const sortedProblems = React.useMemo(() => 
    [...solvedProblems].sort((a, b) => new Date(b.dateSolved).getTime() - new Date(a.dateSolved).getTime()),
    [solvedProblems]
  );

  if (solvedProblems.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary flex items-center">
            <Icons.Archive className="mr-2 h-7 w-7" /> Problem Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No problems logged yet. Start adding your solved problems to see them here!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary flex items-center">
            <Icons.Archive className="mr-2 h-7 w-7" /> Your Problem Log
          </CardTitle>
          <CardDescription>
            A chronicle of your DSA conquests. Review, edit, or remove your entries.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30px] p-2"></TableHead>
                  <TableHead className="w-[50px] p-2">Type</TableHead>
                  <TableHead className="p-2">Title</TableHead>
                  <TableHead className="p-2">Difficulty</TableHead>
                  <TableHead className="p-2">Date Solved</TableHead>
                  <TableHead className="w-[50px] text-center p-2">URL</TableHead>
                  <TableHead className="text-right p-2">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedProblems.map((problem) => (
                  <TableRow key={problem.id} className={problem.isForReview ? 'bg-accent/10' : ''}>
                    <TableCell className="p-2 text-center">
                      {problem.isForReview && <Icons.Bookmark className="h-4 w-4 text-accent" />}
                    </TableCell>
                    <TableCell className="p-2">
                      {getIconForProblemType(problem.type, { className: "h-5 w-5 text-muted-foreground" })}
                    </TableCell>
                    <TableCell className="p-2">
                      <a href={problem.url} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary font-medium">
                        {problem.title}
                      </a>
                    </TableCell>
                    <TableCell className="p-2">
                      <Badge variant={
                        problem.difficulty === 'easy' ? 'default' :
                        problem.difficulty === 'medium' ? 'secondary' : 'destructive'
                      } className={
                        problem.difficulty === 'easy' ? 'bg-green-500/20 text-green-700 border-green-500/30' :
                        problem.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30' :
                        'bg-red-500/20 text-red-700 border-red-500/30'
                      }>
                        {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-2">{format(parseISO(problem.dateSolved), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="p-2 text-center">
                      <a href={problem.url} target="_blank" rel="noopener noreferrer" title="Open solution URL">
                        <Icons.Link className="h-4 w-4 text-primary hover:text-primary/80 inline-block" />
                      </a>
                    </TableCell>
                    <TableCell className="text-right p-2">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleToggleReview(problem)}>
                            <Icons.Bookmark className="mr-2 h-4 w-4" /> 
                            {problem.isForReview ? 'Unmark Review' : 'Mark for Review'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(problem)}>
                            <Icons.Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleConfirmRemove(problem)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                            <Icons.Trash className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Edit Problem Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
                <DialogTitle>Edit Problem</DialogTitle>
            </DialogHeader>
            {editingProblem && (
                <ProblemForm 
                    existingProblem={editingProblem}
                    onUpdateProblem={handleUpdateProblem}
                    onCancelEdit={() => {
                        setIsEditDialogOpen(false);
                        setEditingProblem(null);
                    }}
                    onAddProblem={() => {}} // Not used in edit mode
                    isInDialog={true} // Indicate this form is in a dialog
                />
            )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
       <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete the problem "{problemToRemove?.title}"? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={executeRemove}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

