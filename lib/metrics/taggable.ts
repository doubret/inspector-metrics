
import "source-map-support/register";

export interface ITaggable {
    getTags(): Map<string, string>;
    getTag(name: string): string;
    setTag(name: string, value: string): void;
    removeTag(name: string): void;
}
