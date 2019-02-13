import { Injectable } from '@angular/core';
import { IssueData, IssueProviderKey, SearchResultItem } from './issue';
import { JiraIssue } from './jira/jira-issue/jira-issue.model';
import { Attachment } from '../attachment/attachment.model';
import { JiraApiService } from './jira/jira-api.service';
import { GitApiService } from './git/git-api.service';
import { combineLatest, from, Observable, zip } from 'rxjs';
import { ProjectService } from '../project/project.service';
import { catchError, map, switchMap } from 'rxjs/operators';
import { JiraIssueService } from './jira/jira-issue/jira-issue.service';
import { GitIssueService } from './git/git-issue/git-issue.service';
import { GIT_TYPE, JIRA_TYPE } from './issue.const';

@Injectable({
  providedIn: 'root',
})
export class IssueService {
  public isJiraSearchEnabled$: Observable<boolean> = this._projectService.currentJiraCfg$.pipe(
    map(jiraCfg => jiraCfg && jiraCfg.isEnabled)
  );

  public isGitSearchEnabled$: Observable<boolean> = this._projectService.currentGitCfg$.pipe(
    map(gitCfg => gitCfg && gitCfg.isSearchIssuesFromGit)
  );

  constructor(
    private _jiraApiService: JiraApiService,
    private _gitApiService: GitApiService,
    private _jiraIssueService: JiraIssueService,
    private _gitIssueService: GitIssueService,
    private _projectService: ProjectService,
  ) {
  }


  public async loadStatesForProject(projectId) {
    return Promise.all([
      this._jiraIssueService.loadStateForProject(projectId),
      this._gitIssueService.loadStateForProject(projectId),
    ]);
  }


  public searchIssues(searchTerm: string): Observable<SearchResultItem[]> {
    return combineLatest(
      this.isJiraSearchEnabled$,
      this.isGitSearchEnabled$,
    ).pipe(
      switchMap(([isSearchJira, isSearchGit]) => {
        console.log(isSearchJira, isSearchGit);
        const obs = [];
        obs.push(from([[]]));

        if (isSearchJira) {
          obs.push(
            this._jiraApiService.search(searchTerm, false, 50)
              .pipe(
                catchError(() => {
                  return [];
                })
              )
          );
        }

        if (isSearchGit) {
          obs.push(this._gitApiService.searchIssueForRepo(searchTerm));
        }

        return zip(...obs, (...allResults) => [].concat(...allResults)) as Observable<SearchResultItem[]>;
      })
    );
  }

  public loadMissingIssueData(issueType: IssueProviderKey, issueId: string | number) {
    // TODO refactor to effect
    console.log('LOADING MISSING ISSUE DATA', issueType, issueId);
    switch (issueType) {
      case JIRA_TYPE: {
        this._jiraIssueService.loadMissingIssueData(issueId);
        break;
      }
      case GIT_TYPE: {
        this._gitIssueService.loadMissingIssueData(issueId);
      }
    }
  }

  public refreshIssue(
    issueType: IssueProviderKey,
    issueId: string | number,
    issueData: IssueData,
    isNotifySuccess = true,
    isNotifyNoUpdateRequired = false
  ) {
    switch (issueType) {
      case JIRA_TYPE: {
        this._jiraIssueService.updateIssueFromApi(issueId, issueData, isNotifySuccess, isNotifyNoUpdateRequired);
        break;
      }
      case GIT_TYPE: {
        this._gitIssueService.updateIssueFromApi(issueId);
      }
    }
  }

  public getMappedAttachments(issueType: IssueProviderKey, issueData_: IssueData): Attachment[] {
    switch (issueType) {
      case JIRA_TYPE: {
        const issueData = issueData_ as JiraIssue;
        return this._jiraIssueService.getMappedAttachmentsFromIssue(issueData);
      }
    }
  }
}
