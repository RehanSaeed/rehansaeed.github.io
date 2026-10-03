// github-slugger 1.x (pinned to match Gridsome's remark-slug ids) ships no type declarations.
declare module "github-slugger" {
  export default class GithubSlugger {
    slug(value: string, maintainCase?: boolean): string;
    reset(): void;
  }
}
