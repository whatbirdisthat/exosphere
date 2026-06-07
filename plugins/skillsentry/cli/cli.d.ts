export interface CliResult {
    readonly exitCode: number;
    readonly stdout: string;
}
/** Run the full audit pipeline for a target and return the report + exit code. */
export declare function runAudit(argv: readonly string[]): Promise<CliResult>;
