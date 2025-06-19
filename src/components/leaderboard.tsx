
"use client";

import * as React from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import type { UserPublicProfile } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Icons } from '@/components/icons';
import { Skeleton } from '@/components/ui/skeleton';

const USER_PUBLIC_PROFILES_COLLECTION = 'userPublicProfiles';

function getInitials(name?: string | null): string {
  if (!name) return "AG";
  const names = name.split(' ');
  if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
  return names[0].substring(0, 1).toUpperCase() + names[names.length - 1].substring(0, 1).toUpperCase();
}

export function Leaderboard() {
  const [leaderboardData, setLeaderboardData] = React.useState<UserPublicProfile[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setIsLoading(true);
    setError(null);
    const q = query(
      collection(db, USER_PUBLIC_PROFILES_COLLECTION),
      orderBy('solvedProblemsCount', 'desc'),
      limit(50) // Display top 50 users
    );

    const unsubscribe: Unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const profiles: UserPublicProfile[] = [];
        querySnapshot.forEach((doc) => {
          profiles.push(doc.data() as UserPublicProfile);
        });
        setLeaderboardData(profiles);
        setIsLoading(false);
      }, 
      (err) => {
        console.error("Error fetching leaderboard:", err);
        setError("Could not load leaderboard data. Please try again later.");
        setIsLoading(false);
      }
    );

    return () => unsubscribe(); // Clean up listener on component unmount
  }, []);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl text-primary flex items-center">
          <Icons.Trophy className="mr-2 h-7 w-7" /> Algo Grind Champions
        </CardTitle>
        <CardDescription>
          See who's topping the charts in problem-solving!
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-4 w-[100px]" />
                </div>
                <Skeleton className="ml-auto h-6 w-[50px]" />
              </div>
            ))}
          </div>
        )}
        {!isLoading && error && (
          <p className="text-destructive text-center py-8">{error}</p>
        )}
        {!isLoading && !error && leaderboardData.length === 0 && (
          <p className="text-muted-foreground text-center py-8">
            The leaderboard is empty. Be the first to grind your way to the top!
          </p>
        )}
        {!isLoading && !error && leaderboardData.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px] text-center">Rank</TableHead>
                <TableHead>User</TableHead>
                <TableHead className="text-right">Problems Solved</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboardData.map((profile, index) => (
                <TableRow key={profile.userId}>
                  <TableCell className="font-medium text-center">{index + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-9 w-9">
                        {profile.photoURL && <AvatarImage src={profile.photoURL} alt={profile.displayName || 'User'} />}
                        <AvatarFallback>{getInitials(profile.displayName)}</AvatarFallback>
                      </Avatar>
                      <span>{profile.displayName || 'Anonymous Grinder'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-lg text-primary">
                    {profile.solvedProblemsCount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
